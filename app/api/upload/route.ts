/**
 * POST /api/upload
 *
 * Production-hardened image upload route.
 * Requires an authenticated ADMIN session; all other callers are rejected
 * before any file data is read.
 *
 * Defence layers (in order of execution):
 *  1. Auth gate        – rejects anonymous and non-ADMIN callers (401/403)
 *  2. Rate limiter     – sliding-window per userId (429)
 *  3. Content-Type     – rejects non-multipart requests immediately (415)
 *  4. Content-Length   – refuses oversized requests before parsing (413)
 *  5. File presence    – must have exactly one "file" field (400)
 *  6. MIME whitelist   – server-side, file.type must be an allowed value (415)
 *  7. Magic-byte check – first 12 bytes of the buffer are validated against
 *                        known image signatures (bypasses spoofed file.type) (415)
 *  8. File size limit  – hard cap on the parsed buffer (413)
 *  9. Cloudinary upload – with explicit resource_type and folder
 * 10. Error sanitisation – internal details are never leaked to the caller
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/upload-rate-limiter";

/* ── Runtime ──────────────────────────────────────────────────────────────── */

export const runtime = "nodejs";

/* ── Cloudinary config (module-level singleton) ───────────────────────────── */

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ── Constants ────────────────────────────────────────────────────────────── */

/** Absolute hard cap on the Content-Length header (bytes). Requests claiming
 *  to be larger than this are refused before formData() is ever called. */
const MAX_CONTENT_LENGTH = 8 * 1024 * 1024; // 8 MB

/** Maximum size of the parsed file buffer. A separate guard from the header
 *  check because Content-Length can be omitted or spoofed. */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/** Allowed MIME types (server-side whitelist). */
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

/**
 * Magic-byte signatures for each allowed image format.
 * Each entry: [mimeType, byteOffset, expectedBytes[]]
 *
 * Checking the raw bytes prevents a malicious actor from renaming an .exe
 * to .jpg and uploading it — the MIME type reported by the browser can be
 * completely fabricated.
 */
const MAGIC_SIGNATURES: Array<{ mime: string; offset: number; bytes: number[] }> = [
  // JPEG: FF D8 FF
  { mime: "image/jpeg", offset: 0, bytes: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  { mime: "image/png", offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  // WebP: "RIFF????WEBP" — check bytes 0-3 and 8-11
  { mime: "image/webp", offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"
  // GIF87a / GIF89a
  { mime: "image/gif", offset: 0, bytes: [0x47, 0x49, 0x46, 0x38] }, // "GIF8"
];

/** Extra WebP check: bytes 8-11 must be "WEBP" */
const WEBP_SECONDARY = { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] };

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/** Extract the real client IP, preferring the first entry of X-Forwarded-For
 *  (set by Hostinger's nginx proxy). Falls back to a static placeholder so
 *  the rate limiter always has a key to work with. */
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // req.ip was removed in Next.js 15 (see next-request.md version history)
  return "unknown-ip";
}

/** Validate that the buffer's leading bytes match the declared MIME type.
 *  Returns true only when BOTH the MIME whitelist AND the magic bytes agree. */
function validateMagicBytes(buffer: Buffer, declaredMime: string): boolean {
  const sig = MAGIC_SIGNATURES.find((s) => s.mime === declaredMime);
  if (!sig) return false; // mime not in our signature table

  // Check primary signature
  for (let i = 0; i < sig.bytes.length; i++) {
    if (buffer[sig.offset + i] !== sig.bytes[i]) return false;
  }

  // WebP needs a secondary check at offset 8
  if (declaredMime === "image/webp") {
    for (let i = 0; i < WEBP_SECONDARY.bytes.length; i++) {
      if (buffer[WEBP_SECONDARY.offset + i] !== WEBP_SECONDARY.bytes[i]) return false;
    }
  }

  return true;
}

/** Push a Buffer into a Cloudinary upload stream and resolve with the result. */
function uploadToCloudinary(
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "gotripjapan",
        resource_type: "image",
        // Explicit allowed formats — Cloudinary will reject anything else
        // even if our magic-byte check somehow passes.
        allowed_formats: ["jpg", "png", "webp", "gif"],
      },
      (err, res) => {
        if (err) { reject(err); return; }
        if (!res) { reject(new Error("Empty response from Cloudinary")); return; }
        resolve(res as { secure_url: string; public_id: string });
      }
    );
    stream.end(buffer);
  });
}

/* ── Route handler ────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 1. Auth gate ──────────────────────────────────────────────────────────
  // Verify the session BEFORE touching any body data.
  // Unauthenticated callers are stopped here without any server resources
  // being wasted on file parsing.
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (user.role !== "ADMIN") {
    // Distinguish 401 (no session) from 403 (session but wrong role)
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // ── 2. Rate limiting ──────────────────────────────────────────────────────
  // Rate limit by userId (preferred) with IP as fallback.
  // Using userId for authenticated routes is more reliable than IP because:
  //  - Multiple users can share the same NAT/proxy IP
  //  - Admin proxies / VPNs produce the same IP for legitimate use
  const rateLimitKey = user.id ?? getClientIp(req);
  const { allowed, remaining, resetInMs } = checkRateLimit(rateLimitKey);

  if (!allowed) {
    const retryAfterSeconds = Math.ceil(resetInMs / 1000);
    return NextResponse.json(
      { error: "Too many upload requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(retryAfterSeconds),
        },
      }
    );
  }

  // ── 3. Content-Type guard ─────────────────────────────────────────────────
  // Only accept multipart/form-data. Reject JSON, text, octet-stream, etc.
  // immediately — before any body parsing. This alone defeats many bot
  // attack patterns that POST raw data expecting the server to parse it.
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Request must be multipart/form-data." },
      { status: 415 }
    );
  }

  // ── 4. Content-Length pre-flight ──────────────────────────────────────────
  // Refuse giant uploads before formData() buffers everything into memory.
  // Note: browsers/proxies CAN omit Content-Length, so this is a fast-path
  // rejection only — the actual buffer size is checked again after parsing.
  const rawLength = req.headers.get("content-length");
  if (rawLength !== null) {
    const declaredBytes = parseInt(rawLength, 10);
    if (!Number.isFinite(declaredBytes) || declaredBytes > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `File must be under ${MAX_CONTENT_LENGTH / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }
  }

  // ── 5–8. Parse, validate, and size-check the file ─────────────────────────
  let result: { secure_url: string; public_id: string };

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // ── 5. File presence ────────────────────────────────────────────────────
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "A file field named \"file\" is required." },
        { status: 400 }
      );
    }

    // ── 6. MIME whitelist (server-side) ─────────────────────────────────────
    // file.type is derived from the Content-Type in the multipart envelope,
    // which the browser sets from the file's OS-reported type. It can be
    // spoofed, so this is a first filter only — magic bytes check below is
    // the authoritative gate.
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, or GIF images are accepted." },
        { status: 415 }
      );
    }

    // ── 7. Magic-byte validation ─────────────────────────────────────────────
    // Read into a Buffer ONCE to avoid double-reads.
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match its declared type." },
        { status: 415 }
      );
    }

    // ── 8. Parsed file size ──────────────────────────────────────────────────
    // Second size check after parsing — guards against missing/falsified
    // Content-Length headers.
    if (buffer.byteLength > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File must be under ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    // ── 9. Cloudinary upload ─────────────────────────────────────────────────
    result = await uploadToCloudinary(buffer);

  } catch (err: unknown) {
    // Distinguish client-caused parse failures from server/network errors.
    // Never expose internal paths, stack traces, or Cloudinary credentials
    // to the caller.
    const isClientError =
      err instanceof Error &&
      (err.message.includes("Invalid form data") ||
        err.message.includes("multipart"));

    console.error("[upload] Error:", err);

    return NextResponse.json(
      { error: isClientError ? "Invalid multipart request." : "Upload failed. Please try again." },
      { status: isClientError ? 400 : 500 }
    );
  }

  // ── 10. Success ───────────────────────────────────────────────────────────
  return NextResponse.json(
    { url: result.secure_url },
    {
      status: 200,
      headers: {
        "X-RateLimit-Limit": "10",
        "X-RateLimit-Remaining": String(remaining),
      },
    }
  );
}
