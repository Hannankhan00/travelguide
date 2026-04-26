import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);
const ADMIN_LOGIN = "/admin/login";

// ── Scanner / probe paths ────────────────────────────────────────────────────
// These paths NEVER exist on this Next.js application. Any request to them is
// a WordPress probe, PHP scanner, or path-traversal attempt. Return 410 Gone
// (not 404) — search engines treat 410 as "permanently absent, stop retrying",
// whereas 404 may trigger re-crawls. This fires in middleware so the Node.js
// runtime is never reached.
const SCANNER_PATHS: readonly string[] = [
  "/wp-admin",
  "/wp-login.php",
  "/wp-content",
  "/wp-includes",
  "/wp-config",
  "/xmlrpc.php",
  "/.env",
  "/.git",
  "/.htaccess",
  "/.aws",
  "/.ssh",
  "/phpinfo",
  "/phpmyadmin",
  "/adminer",
  "/setup.php",
  "/install.php",
  "/config.php",
  "/shell.php",
  "/c99.php",
  "/r57.php",
  "/eval.php",
  "/cmd.php",
  "/cgi-bin",
  "/server-status",
  "/server-info",
];

// ── Malicious user-agent fragments ───────────────────────────────────────────
// Only security scanners, fuzzers, and known abusive crawlers.
// Legitimate SEO bots (Googlebot, Bingbot, etc.) are NOT in this list —
// false-positive risk is negligible because these strings never appear in
// real browser or legitimate crawler UAs.
const SCANNER_UA_FRAGMENTS: readonly string[] = [
  "nikto",
  "sqlmap",
  "nmap",
  "masscan",
  "zgrab",
  "nuclei",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "ffuf",
  "burpsuite",
  "hydra",
  "metasploit",
  "nessus",
  "openvas",
  "acunetix",
  "w3af",
  "skipfish",
  "zaproxy",
  "arachni",
  "libwww-perl",
  "python-urllib",
  "scrapy",
  // Petalbot: Bytedance/Baidu crawler known for ignoring robots.txt
  "petalbot",
];

// ── Broader bot list for admin routes ────────────────────────────────────────
// Admin pages must never be indexed. Block ALL crawlers here — even legitimate
// SEO bots — because robots.txt + X-Robots-Tag is not a hard guarantee.
const ALL_BOT_UA_FRAGMENTS: readonly string[] = [
  "bot",
  "crawler",
  "spider",
  "scraper",
];

// ── In-memory sliding-window rate limiter ────────────────────────────────────
// Works on single-server deployments (Hostinger VPS) where module-level state
// persists for the process lifetime. On truly serverless/Edge deployments
// this is per-instance, which still catches naive bots hitting one instance.
const hitMap = new Map<string, number[]>();
const WINDOW_MS = 60_000; // 1-minute sliding window

function rateCheck(key: string, limit: number): boolean {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const hits = (hitMap.get(key) ?? []).filter((t) => t > cutoff);
  hits.push(now);
  hitMap.set(key, hits);
  // Evict fully-stale entries to prevent unbounded map growth
  if (hitMap.size > 5_000) {
    for (const [k, ts] of hitMap) {
      if (!ts.some((t) => t > cutoff)) hitMap.delete(k);
    }
  }
  return hits.length <= limit;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getIp(req: NextRequest): string {
  // Hostinger's nginx sets X-Forwarded-For; take the first (client) IP.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function isScannerPath(path: string): boolean {
  const p = path.toLowerCase();
  return SCANNER_PATHS.some(
    (s) => p === s || p.startsWith(s + "/") || p.startsWith(s + "?")
  );
}

function isScannerUa(req: NextRequest): boolean {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  return SCANNER_UA_FRAGMENTS.some((f) => ua.includes(f));
}

function isAnyBot(req: NextRequest): boolean {
  const ua = (req.headers.get("user-agent") ?? "").toLowerCase();
  return ALL_BOT_UA_FRAGMENTS.some((f) => ua.includes(f));
}

// ── Middleware ────────────────────────────────────────────────────────────────

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const ip = getIp(req);

  // ── 1. Scanner path → 410 Gone ─────────────────────────────────────────
  // Fires before any other check. The Node.js runtime never runs for these
  // requests, which eliminates the CPU cost of rendering a 404 page.
  if (isScannerPath(pathname)) {
    return new NextResponse(null, { status: 410 });
  }

  // ── 2. Scanner / fuzzer UA → 403 ──────────────────────────────────────
  if (isScannerUa(req)) {
    return new NextResponse(null, { status: 403 });
  }

  // ── 3. IP rate limiting ────────────────────────────────────────────────
  // API routes get a tighter cap (30 req/min) because each one hits the DB.
  // General page routes get 120 req/min, which is well above any human user.
  const isApiRoute = pathname.startsWith("/api/");
  const limit = isApiRoute ? 30 : 120;
  const rlKey = `${isApiRoute ? "api" : "gen"}:${ip}`;

  if (!rateCheck(rlKey, limit)) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": String(limit),
      },
    });
  }

  // ── 4. Admin routes ────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    // Deny ALL crawlers — even legitimate SEO bots — from admin routes.
    // robots.txt + X-Robots-Tag are advisory; this is the hard gate.
    if (isAnyBot(req)) {
      return new NextResponse(null, { status: 403 });
    }

    const isAdmin = req.auth?.user?.role === "ADMIN";

    if (pathname.startsWith("/api/admin")) {
      if (!isAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const res = NextResponse.next();
      res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      return res;
    }

    if (pathname !== ADMIN_LOGIN && !isAdmin) {
      return NextResponse.redirect(new URL(ADMIN_LOGIN, req.url));
    }

    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return res;
  }

  // ── 5. Session endpoint — browser-side caching ────────────────────────
  // Each SessionProvider mount and every page hydration hits this route.
  // The session is a signed JWT: the server decodes it in microseconds, but
  // hundreds of concurrent browser requests still exhaust worker slots.
  // private, max-age=60 keeps the response in the browser cache for 60 s so
  // a user navigating across pages doesn't repeat the round-trip.
  // s-maxage=0 ensures Hostinger's nginx proxy never caches it server-side
  // (sessions are per-user and must not be shared across requests).
  if (pathname === "/api/auth/session") {
    const res = NextResponse.next();
    res.headers.set(
      "Cache-Control",
      "private, max-age=60, s-maxage=0, must-revalidate"
    );
    return res;
  }

  // ── 6. Auth routes — suppress indexing ────────────────────────────────
  if (pathname.startsWith("/auth/")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // ── 7. Booking routes — suppress indexing (contains personal data) ─────
  if (pathname.startsWith("/bookings") || pathname.startsWith("/booking/")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Run on all routes except Next.js build assets and well-known static files.
    // This ensures scanner-path blocking fires in the Edge layer before the
    // Node.js runtime is ever invoked.
    "/((?!_next/static|_next/image|_next/webpack-hmr|favicon\\.ico|icon\\.png|robots\\.txt|sitemap\\.xml).*)",
  ],
};
