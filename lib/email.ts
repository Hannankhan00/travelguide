import nodemailer from "nodemailer";
import { COMPANY_NAME, COMPANY_EMAIL } from "./constants";

// Module-level singleton — one TCP connection pool for the process lifetime.
// Previously createTransporter() was called inside sendEmail(), which opened a
// new raw connection on every single email. Under any load (discount batch sends,
// booking confirmations, password resets) this exhausted the SMTP server's
// connection limit, causing sendMail() to throw and surfacing as HTTP 500s.
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailOptions {
  to:      string;
  subject: string;
  html:    string;
  text?:   string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.SMTP_FROM ?? COMPANY_EMAIL;
  return transporter.sendMail({
    from:       `"${COMPANY_NAME}" <${from}>`,
    replyTo:    from,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim(),
    headers: {
      "X-Mailer":         "GoTripJapan Mailer",
      "X-Priority":       "3",
      "Precedence":       "bulk",
      "List-Unsubscribe": `<mailto:${from}?subject=unsubscribe>`,
    },
  });
}

// ─── Shared base ──────────────────────────────────────────────────────────────

function baseTemplate({
  previewText,
  headerLabel,
  headerIcon,
  accentColor = "#C41230",
  body,
}: {
  previewText:   string;
  headerLabel:   string;
  headerIcon:    string;
  accentColor?:  string;
  body:          string;
}): string {
  const year = new Date().getFullYear();
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${previewText}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#F2F0ED;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#F2F0ED;">${previewText}&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#F2F0ED;">
    <tr>
      <td align="center" style="padding:32px 16px 48px;">

        <!-- Outer card -->
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="background-color:#0C1C35;border-radius:16px 16px 0 0;padding:0;overflow:hidden;">

              <!-- Top rainbow bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#C41230 0%,#E8742A 33%,#C8A84B 66%,#1B5FA5 100%);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="padding:36px 40px 32px;text-align:center;">
                    <!-- Logo wordmark -->
                    <div style="margin-bottom:20px;">
                      <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#C8A84B;letter-spacing:4px;text-transform:uppercase;">${COMPANY_NAME}</span>
                    </div>
                    <!-- Thin gold rule -->
                    <table width="60" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto 20px;">
                      <tr><td style="height:1px;background:#C8A84B;font-size:0;">&nbsp;</td></tr>
                    </table>
                    <!-- Icon + label pill -->
                    <div style="display:inline-block;background-color:${accentColor};border-radius:24px;padding:8px 20px;">
                      <span style="font-size:16px;vertical-align:middle;">${headerIcon}&nbsp;</span>
                      <span style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;vertical-align:middle;">${headerLabel}</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:44px 40px 36px;">
              ${body}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#F8F7F5;border-radius:0 0 16px 16px;border-top:1px solid #E8E4DD;padding:28px 40px;text-align:center;">
              <!-- Divider -->
              <table width="40" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto 20px;">
                <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#C8A84B,transparent);font-size:0;">&nbsp;</td></tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;color:#7A746D;">Questions? We&rsquo;re always here.</p>
              <a href="mailto:${COMPANY_EMAIL}" style="color:#C41230;font-size:13px;font-weight:600;text-decoration:none;">${COMPANY_EMAIL}</a>
              <p style="margin:20px 0 0;font-size:11px;color:#B0A99F;">&copy; ${year} ${COMPANY_NAME}. All rights reserved.<br/>Tokyo, Japan</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detailRow(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:13px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#7A746D;width:45%;">${label}</td>
    <td style="padding:13px 0;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:600;color:#0C1C35;text-align:right;">${value}</td>
  </tr>`;
}

function ctaButton(label: string, url: string, color = "#C41230"): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:32px auto 0;">
    <tr>
      <td style="background-color:${color};border-radius:10px;box-shadow:0 4px 14px rgba(196,18,48,0.3);">
        <a href="${url}" style="display:inline-block;padding:15px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">${label} &rarr;</a>
      </td>
    </tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `
  <p style="margin:24px 0 0;font-size:12px;color:#A8A29E;line-height:1.7;word-break:break-all;">
    Button not working? Paste this link into your browser:<br/>
    <a href="${url}" style="color:#C41230;text-decoration:underline;">${url}</a>
  </p>`;
}

// ─── 1. Email verification ────────────────────────────────────────────────────

export function emailVerificationHtml(data: {
  name:      string;
  verifyUrl: string;
}): string {
  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">Welcome, ${data.name}! &#x1F1EF;&#x1F1F5;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Your ${COMPANY_NAME} account is almost ready. Just one step left — verify your email address to unlock your account and start discovering Japan.
    </p>

    <!-- Expiry notice card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:linear-gradient(135deg,#0C1C35,#1B3060);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:11px;color:rgba(200,168,75,0.85);letter-spacing:2px;text-transform:uppercase;">Link expires in</p>
                <p style="margin:0;font-size:32px;font-weight:700;color:#C8A84B;">24 hours</p>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <span style="font-size:40px;">&#x23F0;</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F8F9FF;border-radius:12px;border:1px solid #E8EAFF;margin-bottom:8px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#0C1C35;text-transform:uppercase;letter-spacing:1px;">What happens next</p>
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="padding:5px 0;">
                <span style="display:inline-block;width:22px;height:22px;background:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:22px;vertical-align:middle;">1</span>
                <span style="font-size:14px;color:#4A4540;margin-left:10px;vertical-align:middle;">Click the button below</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0;">
                <span style="display:inline-block;width:22px;height:22px;background:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:22px;vertical-align:middle;">2</span>
                <span style="font-size:14px;color:#4A4540;margin-left:10px;vertical-align:middle;">Your email is verified instantly</span>
              </td>
            </tr>
            <tr>
              <td style="padding:5px 0;">
                <span style="display:inline-block;width:22px;height:22px;background:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:22px;vertical-align:middle;">3</span>
                <span style="font-size:14px;color:#4A4540;margin-left:10px;vertical-align:middle;">Sign in and start exploring Japan &#x1F5FE;</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Verify My Email Address", data.verifyUrl)}
    ${fallbackLink(data.verifyUrl)}

    <p style="margin:20px 0 0;font-size:12px;color:#B0A99F;">Didn&rsquo;t create an account? You can safely ignore this email.</p>
  `;

  return baseTemplate({
    previewText:  `${data.name}, one click to activate your ${COMPANY_NAME} account`,
    headerLabel:  "Verify Your Email",
    headerIcon:   "&#x2709;&#xFE0F;",
    accentColor:  "#C41230",
    body,
  });
}

// ─── 2. Booking confirmation ──────────────────────────────────────────────────

export function bookingConfirmationHtml(data: {
  customerName:  string;
  bookingRef:    string;
  tourTitle:     string;
  tourDate:      string;
  numGuests:     number;
  totalAmount:   string;
  paymentMethod: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">Your adventure is confirmed! &#x1F38C;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Hi ${data.customerName}, we&rsquo;re excited to welcome you on this journey through Japan. Your booking is locked in and ready to go.
    </p>

    <!-- Booking ref hero card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:linear-gradient(135deg,#0C1C35,#1B3060);border-radius:14px;margin-bottom:24px;">
      <tr>
        <td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:11px;color:rgba(200,168,75,0.85);letter-spacing:2px;text-transform:uppercase;">Booking Reference</p>
                <p style="margin:0;font-size:28px;font-weight:700;color:#C8A84B;letter-spacing:3px;">${data.bookingRef}</p>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <div style="display:inline-block;background-color:#16A34A;border-radius:20px;padding:7px 16px;">
                  <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#10003; Confirmed</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Tour name banner -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFF8E7;border-left:4px solid #C8A84B;border-radius:0 10px 10px 0;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 2px;font-size:11px;color:#B45309;text-transform:uppercase;letter-spacing:1px;">Tour</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#0C1C35;">${data.tourTitle}</p>
        </td>
      </tr>
    </table>

    <!-- Detail rows -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:4px;">
      ${detailRow("&#128197; Date", data.tourDate)}
      ${detailRow("&#128101; Guests", `${data.numGuests} ${data.numGuests === 1 ? "person" : "people"}`)}
      ${detailRow("&#128179; Payment", data.paymentMethod)}
    </table>

    <!-- Total paid -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F8F7F5;border-radius:10px;margin-top:16px;border:1px solid #E8E4DD;">
      <tr>
        <td style="padding:18px 20px;font-size:14px;font-weight:600;color:#7A746D;">Total Paid</td>
        <td style="padding:18px 20px;text-align:right;font-size:26px;font-weight:700;color:#C41230;">${data.totalAmount}</td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:14px;color:#5A5550;line-height:1.75;padding:20px;background:#F8F9FF;border-radius:10px;border:1px solid #E8EAFF;">
      &#x1F4AC; Need to make changes? Simply reply to this email — our team typically responds within 2 hours.
    </p>
  `;

  return baseTemplate({
    previewText:  `Booking confirmed: ${data.tourTitle} — Ref ${data.bookingRef}`,
    headerLabel:  "Booking Confirmed",
    headerIcon:   "&#x2705;",
    accentColor:  "#16A34A",
    body,
  });
}

// ─── 3. Guide message notification ───────────────────────────────────────────

export function guideMessageHtml(data: {
  customerName:   string;
  guideName:      string;
  messagePreview: string;
  tourTitle:      string;
  bookingRef:     string;
  viewUrl:        string;
}): string {
  const body = `
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">New message from your guide &#x1F4AC;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Hi ${data.customerName}, <strong>${data.guideName}</strong> has sent you a message about your upcoming tour.
    </p>

    <!-- Tour badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F8F7F5;border-radius:10px;border:1px solid #E8E4DD;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 2px;font-size:11px;color:#7A746D;text-transform:uppercase;letter-spacing:1px;">Your tour</p>
          <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0C1C35;">${data.tourTitle}</p>
          <p style="margin:0;font-size:12px;color:#A8A29E;">Ref: ${data.bookingRef}</p>
        </td>
      </tr>
    </table>

    <!-- Message bubble -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;">
      <tr>
        <td style="background:#EEF4FF;border-radius:12px;padding:24px;border:1px solid #D4E4FF;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#1B5FA5;text-transform:uppercase;letter-spacing:1px;">&#x1F5E8; ${data.guideName} wrote:</p>
          <p style="margin:0;font-size:15px;color:#2A2520;line-height:1.75;font-style:italic;">&ldquo;${data.messagePreview}${data.messagePreview.length >= 200 ? "&hellip;" : ""}&rdquo;</p>
        </td>
      </tr>
    </table>

    ${ctaButton("Read Full Message", data.viewUrl, "#1B5FA5")}

    <p style="margin:24px 0 0;font-size:13px;color:#7A746D;text-align:center;">
      You can also reply directly from your bookings dashboard.
    </p>
  `;

  return baseTemplate({
    previewText:  `${data.guideName}: new message about your ${data.tourTitle} tour`,
    headerLabel:  "Message from Your Guide",
    headerIcon:   "&#x1F5E8;&#xFE0F;",
    accentColor:  "#1B5FA5",
    body,
  });
}

// ─── 4. Wishlist discount alert ───────────────────────────────────────────────

export function wishlistDiscountHtml(data: {
  customerName:    string;
  tourTitle:       string;
  tourSlug:        string;
  discountCode:    string;
  discountLabel:   string;
  originalPrice:   string;
  discountedPrice?: string;
  validUntil?:     string;
  tourImageUrl?:   string;
}): string {
  const tourUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/tours/${data.tourSlug}`;

  const body = `
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">Price drop on your wishlist! &#x1F4C9;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Hi ${data.customerName}, great news — a tour you saved just got a price drop. Book now before it sells out!
    </p>

    <!-- Tour hero -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:linear-gradient(135deg,#0C1C35,#1B3060);border-radius:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:28px 32px;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(200,168,75,0.85);letter-spacing:2px;text-transform:uppercase;">&#x2764;&#xFE0F; Your Wishlisted Tour</p>
          <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">${data.tourTitle}</p>
          <div style="display:inline-block;background:#C41230;color:#ffffff;font-size:20px;font-weight:700;padding:8px 20px;border-radius:8px;">${data.discountLabel}</div>
        </td>
      </tr>
    </table>

    <!-- Price comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#F8F7F5;border-radius:12px;border:1px solid #E8E4DD;margin-bottom:20px;">
      <tr>
        <td width="50%" style="padding:20px;text-align:center;border-right:1px solid #E8E4DD;">
          <p style="margin:0 0 4px;font-size:11px;color:#7A746D;text-transform:uppercase;letter-spacing:1px;">Was</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#C0B8B0;text-decoration:line-through;">${data.originalPrice}</p>
        </td>
        <td width="50%" style="padding:20px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:#7A746D;text-transform:uppercase;letter-spacing:1px;">Now</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#C41230;">${data.discountedPrice ?? "See page"}</p>
        </td>
      </tr>
    </table>

    <!-- Promo code -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFFBF0;border:2px dashed #C8A84B;border-radius:12px;margin-bottom:8px;">
      <tr>
        <td style="padding:22px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Your Discount Code</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0C1C35;letter-spacing:6px;font-family:monospace;">${data.discountCode}</p>
          ${data.validUntil ? `<p style="margin:8px 0 0;font-size:12px;color:#C41230;font-weight:600;">&#x23F3; Expires ${data.validUntil}</p>` : ""}
        </td>
      </tr>
    </table>

    ${ctaButton("Book Now & Save", tourUrl)}

    <p style="margin:20px 0 0;font-size:12px;color:#A8A29E;text-align:center;">Apply the code at checkout. Limited-time offer.</p>
  `;

  return baseTemplate({
    previewText:  `${data.discountLabel} off your wishlisted tour: ${data.tourTitle}`,
    headerLabel:  "Price Drop Alert",
    headerIcon:   "&#x1F4C9;",
    accentColor:  "#C41230",
    body,
  });
}

// ─── 5. Password reset ────────────────────────────────────────────────────────

export function passwordResetHtml(data: {
  name:     string;
  resetUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">Reset your password &#x1F510;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Hi ${data.name}, we received a request to reset the password for your ${COMPANY_NAME} account. Use the button below to set a new one.
    </p>

    <!-- Expiry card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:linear-gradient(135deg,#0C1C35,#1B3060);border-radius:12px;margin-bottom:28px;">
      <tr>
        <td style="padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:11px;color:rgba(200,168,75,0.85);letter-spacing:2px;text-transform:uppercase;">This link expires in</p>
                <p style="margin:0;font-size:32px;font-weight:700;color:#C8A84B;">1 hour</p>
              </td>
              <td style="text-align:right;vertical-align:middle;font-size:40px;">&#x23F1;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Set New Password", data.resetUrl)}
    ${fallbackLink(data.resetUrl)}

    <p style="margin:24px 0 0;font-size:13px;color:#A8A29E;padding:16px;background:#FFF8F8;border-radius:8px;border:1px solid #FECDD3;text-align:center;">
      &#x26A0;&#xFE0F; If you didn&rsquo;t request this, ignore this email. Your password will <strong>not</strong> change.
    </p>
  `;

  return baseTemplate({
    previewText:  `Password reset request for your ${COMPANY_NAME} account`,
    headerLabel:  "Password Reset",
    headerIcon:   "&#x1F510;",
    accentColor:  "#B45309",
    body,
  });
}

// ─── 6. Deal alert (newsletter subscribers) ───────────────────────────────────

export function dealAlertHtml(data: {
  customerName:      string;
  tourTitle:         string;
  tourSlug:          string;
  discountCode:      string;
  discountLabel:     string;
  originalPrice:     string;
  validUntil?:       string;
  shortDescription?: string;
  unsubscribeUrl:    string;
}): string {
  const tourUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/tours/${data.tourSlug}`;

  const body = `
    <p style="margin:0 0 6px;font-size:26px;font-weight:700;color:#0C1C35;line-height:1.2;">Exclusive deal, just for you &#x1F381;</p>
    <p style="margin:0 0 28px;font-size:15px;color:#5A5550;line-height:1.75;">
      Hi ${data.customerName}, as a ${COMPANY_NAME} subscriber you get first access to our freshest offers — before anyone else.
    </p>

    <!-- Tour hero -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:linear-gradient(135deg,#C41230,#8B0D20);border-radius:14px;margin-bottom:20px;">
      <tr>
        <td style="padding:32px;">
          <p style="margin:0 0 4px;font-size:11px;color:rgba(255,255,255,0.65);letter-spacing:2px;text-transform:uppercase;">Featured Tour</p>
          <p style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${data.tourTitle}</p>
          ${data.shortDescription ? `<p style="margin:0 0 20px;font-size:14px;color:rgba(255,255,255,0.8);line-height:1.6;">${data.shortDescription}</p>` : ""}
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="background:#C8A84B;color:#0C1C35;font-size:22px;font-weight:700;padding:10px 24px;border-radius:8px;">${data.discountLabel}</td>
              <td style="padding-left:14px;font-size:15px;color:rgba(255,255,255,0.6);text-decoration:line-through;vertical-align:middle;">was ${data.originalPrice}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Promo code -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background:#FFFBF0;border:2px dashed #C8A84B;border-radius:12px;margin-bottom:8px;">
      <tr>
        <td style="padding:22px;text-align:center;">
          <p style="margin:0 0 6px;font-size:11px;color:#92400E;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Subscriber Exclusive Code</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#0C1C35;letter-spacing:6px;font-family:monospace;">${data.discountCode}</p>
          ${data.validUntil ? `<p style="margin:8px 0 0;font-size:12px;color:#C41230;font-weight:600;">&#x23F3; Valid until ${data.validUntil}</p>` : ""}
        </td>
      </tr>
    </table>

    ${ctaButton("Claim This Deal", tourUrl)}

    <p style="margin:28px 0 0;font-size:12px;color:#A8A29E;text-align:center;line-height:1.6;">
      You&rsquo;re receiving this because you subscribed to ${COMPANY_NAME} deals.<br/>
      <a href="${data.unsubscribeUrl}" style="color:#7A746D;text-decoration:underline;">Unsubscribe</a>
    </p>
  `;

  return baseTemplate({
    previewText:  `Members-only: ${data.discountLabel} on ${data.tourTitle}`,
    headerLabel:  "Members-Only Deal",
    headerIcon:   "&#x1F381;",
    accentColor:  "#C41230",
    body,
  });
}
