import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { verifyPayPalWebhook }       from "@/lib/paypal";

export async function POST(req: NextRequest) {
  // ── 1. Read raw body (required for signature verification) ────────────────
  const rawBody = await req.text();

  // ── 2. Verify signature ───────────────────────────────────────────────────
  try {
    const valid = await verifyPayPalWebhook(rawBody, {
      authAlgo:         req.headers.get("paypal-auth-algo")         ?? "",
      certUrl:          req.headers.get("paypal-cert-url")          ?? "",
      transmissionId:   req.headers.get("paypal-transmission-id")   ?? "",
      transmissionSig:  req.headers.get("paypal-transmission-sig")  ?? "",
      transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
    });

    if (!valid) {
      console.warn("[paypal/webhook] Signature verification failed");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } catch (err) {
    console.error("[paypal/webhook] Verification error:", err);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── 3. Parse event ────────────────────────────────────────────────────────
  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, resource } = event;

  // ── 4. Handle events ──────────────────────────────────────────────────────
  try {
    switch (event_type) {

      case "PAYMENT.CAPTURE.COMPLETED": {
        const captureId = resource.id as string | undefined;
        const orderId   = (resource.supplementary_data as Record<string, unknown> | undefined)
                          ?.related_ids as Record<string, unknown> | undefined;
        const paypalOrderId = orderId?.order_id as string | undefined;

        if (!captureId) break;

        const booking = await prisma.booking.findFirst({
          where: {
            OR: [
              { paypalCaptureId: captureId },
              ...(paypalOrderId ? [{ paypalOrderId }] : []),
            ],
          },
          select: { id: true, paymentStatus: true },
        });

        if (booking && booking.paymentStatus !== "PAID") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus:   "PAID",
              paypalCaptureId: captureId,
              status:          "CONFIRMED",
              paidAt:          new Date(),
              confirmedAt:     new Date(),
            },
          });
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED": {
        const orderId = (resource.supplementary_data as Record<string, unknown> | undefined)
                        ?.related_ids as Record<string, unknown> | undefined;
        const paypalOrderId = orderId?.order_id as string | undefined;

        if (!paypalOrderId) break;

        const booking = await prisma.booking.findFirst({
          where:  { paypalOrderId },
          select: { id: true, status: true },
        });

        if (booking && booking.status !== "CANCELLED") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: "FAILED",
              status:        "CANCELLED",
              cancelledAt:   new Date(),
              cancellationNote: `PayPal event: ${event_type}`,
            },
          });
        }
        break;
      }

      // Acknowledge but no action needed — capture-order route handles this
      case "CHECKOUT.ORDER.APPROVED":
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`[paypal/webhook] Handler failed for ${event_type}:`, err);
    // Return 500 so PayPal retries delivery
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
