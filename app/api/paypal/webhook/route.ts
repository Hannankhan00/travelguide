import { NextRequest, NextResponse } from "next/server";
import { prisma }                    from "@/lib/prisma";
import { verifyPayPalWebhook }       from "@/lib/paypal";

export async function POST(req: NextRequest) {
  const rawBody       = await req.text();
  const transmissionId = req.headers.get("paypal-transmission-id") ?? undefined;

  // ── 1. Dedup — ignore already-processed transmissions ─────────────────────
  if (transmissionId) {
    const existing = await prisma.webhookLog.findUnique({
      where: { transmissionId },
      select: { id: true },
    });
    if (existing) return NextResponse.json({ received: true });
  }

  // ── 2. Verify signature (skipped in sandbox — simulator sends dummy sigs) ──
  const isSandbox = process.env.PAYPAL_ENV !== "production";

  if (!isSandbox) {
    let signatureValid = false;
    try {
      signatureValid = await verifyPayPalWebhook(rawBody, {
        authAlgo:         req.headers.get("paypal-auth-algo")         ?? "",
        certUrl:          req.headers.get("paypal-cert-url")          ?? "",
        transmissionId:   transmissionId                              ?? "",
        transmissionSig:  req.headers.get("paypal-transmission-sig")  ?? "",
        transmissionTime: req.headers.get("paypal-transmission-time") ?? "",
      });
    } catch (err) {
      await prisma.webhookLog.create({
        data: {
          source:        "PAYPAL",
          eventType:     "UNKNOWN",
          transmissionId,
          status:        "SIGNATURE_ERROR",
          payload:       rawBody,
          error:         String(err),
        },
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!signatureValid) {
      await prisma.webhookLog.create({
        data: {
          source:        "PAYPAL",
          eventType:     "UNKNOWN",
          transmissionId,
          status:        "SIGNATURE_FAILED",
          payload:       rawBody,
        },
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // ── 3. Parse event ─────────────────────────────────────────────────────────
  let event: { event_type: string; resource: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { event_type, resource } = event;

  // ── 4. Handle + log ────────────────────────────────────────────────────────
  let bookingId: string | undefined;
  let logStatus = "SUCCESS";
  let logError: string | undefined;

  try {
    switch (event_type) {

      case "PAYMENT.CAPTURE.COMPLETED": {
        const captureId     = resource.id as string | undefined;
        const relatedIds    = (resource.supplementary_data as Record<string, unknown> | undefined)
                              ?.related_ids as Record<string, unknown> | undefined;
        const paypalOrderId = relatedIds?.order_id as string | undefined;

        if (captureId) {
          const booking = await prisma.booking.findFirst({
            where: {
              OR: [
                { paypalCaptureId: captureId },
                ...(paypalOrderId ? [{ paypalOrderId }] : []),
              ],
            },
            select: { id: true, paymentStatus: true },
          });

          bookingId = booking?.id;

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
          } else if (!booking) {
            logStatus = "IGNORED";
          }
        }
        break;
      }

      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.REVERSED": {
        const relatedIds    = (resource.supplementary_data as Record<string, unknown> | undefined)
                              ?.related_ids as Record<string, unknown> | undefined;
        const paypalOrderId = relatedIds?.order_id as string | undefined;

        if (paypalOrderId) {
          const booking = await prisma.booking.findFirst({
            where:  { paypalOrderId },
            select: { id: true, status: true },
          });

          bookingId = booking?.id;

          if (booking && booking.status !== "CANCELLED") {
            await prisma.booking.update({
              where: { id: booking.id },
              data: {
                paymentStatus:    "FAILED",
                status:           "CANCELLED",
                cancelledAt:      new Date(),
                cancellationNote: `PayPal event: ${event_type}`,
              },
            });
          } else if (!booking) {
            logStatus = "IGNORED";
          }
        }
        break;
      }

      case "CHECKOUT.ORDER.APPROVED":
        logStatus = "IGNORED";
        break;

      default:
        logStatus = "IGNORED";
        break;
    }
  } catch (err) {
    logStatus = "FAILED";
    logError  = String(err);
    await prisma.webhookLog.create({
      data: {
        source:        "PAYPAL",
        eventType:     event_type,
        transmissionId,
        status:        logStatus,
        bookingId,
        payload:       rawBody,
        error:         logError,
      },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  await prisma.webhookLog.create({
    data: {
      source:        "PAYPAL",
      eventType:     event_type,
      transmissionId,
      status:        logStatus,
      bookingId,
      payload:       rawBody,
    },
  });

  return NextResponse.json({ received: true });
}
