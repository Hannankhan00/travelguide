import nodemailer from "nodemailer";
import { COMPANY_NAME, COMPANY_EMAIL } from "./constants";

export const transporter = nodemailer.createTransport({
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
  previewText:  string;
  headerLabel:  string;
  headerIcon:   string;
  accentColor?: string;
  body:         string;
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
<body style="margin:0;padding:0;background-color:#EFEDE9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:#EFEDE9;">${previewText}&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;&nbsp;&#8199;&#65279;&#847;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#EFEDE9;">
    <tr>
      <td align="center" style="padding:40px 16px 56px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation" style="max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="padding:0;border-radius:16px 16px 0 0;overflow:hidden;">
              <!-- Crimson top accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="height:5px;background-color:#C41230;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <!-- Navy header body -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1B2847;">
                <tr>
                  <td style="padding:40px 48px 36px;text-align:center;">
                    <!-- Wordmark -->
                    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:400;color:rgba(200,168,75,0.6);letter-spacing:5px;text-transform:uppercase;">DISCOVER JAPAN</p>
                    <p style="margin:0 0 28px;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:#C8A84B;letter-spacing:3px;text-transform:uppercase;line-height:1;">${COMPANY_NAME}</p>
                    <!-- Thin gold rule -->
                    <table width="48" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto 28px;">
                      <tr><td style="height:1px;background-color:#C8A84B;font-size:0;line-height:0;">&nbsp;</td></tr>
                    </table>
                    <!-- Label pill -->
                    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto;">
                      <tr>
                        <td style="background-color:${accentColor};border-radius:30px;padding:9px 24px;">
                          <span style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#ffffff;">${headerIcon}&nbsp; ${headerLabel}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── BODY ── -->
          <tr>
            <td style="background:#ffffff;padding:48px 48px 40px;">
              ${body}
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="background-color:#1B2847;border-radius:0 0 16px 16px;padding:32px 48px;text-align:center;">
              <table width="32" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:0 auto 20px;">
                <tr><td style="height:1px;background-color:#C8A84B;font-size:0;">&nbsp;</td></tr>
              </table>
              <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.55);">Questions? We&rsquo;re always here for you.</p>
              <a href="mailto:${COMPANY_EMAIL}" style="color:#C8A84B;font-size:13px;font-weight:600;text-decoration:none;">${COMPANY_EMAIL}</a>
              <p style="margin:20px 0 0;font-size:11px;color:rgba(255,255,255,0.3);line-height:1.7;">&copy; ${year} ${COMPANY_NAME}. All rights reserved.<br/>Tokyo, Japan</p>
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
    <td style="padding:14px 0;border-bottom:1px solid #F0EDE8;font-size:13px;color:#9A948E;font-weight:500;width:48%;">${label}</td>
    <td style="padding:14px 0;border-bottom:1px solid #F0EDE8;font-size:14px;font-weight:700;color:#1B2847;text-align:right;">${value}</td>
  </tr>`;
}

function ctaButton(label: string, url: string, color = "#C41230"): string {
  return `
  <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin:36px auto 0;width:100%;">
    <tr>
      <td style="text-align:center;">
        <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="display:inline-block;margin:0 auto;">
          <tr>
            <td style="background-color:${color};border-radius:8px;">
              <a href="${url}" style="display:inline-block;padding:16px 40px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.5px;">${label} &rarr;</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>`;
}

function fallbackLink(url: string): string {
  return `
  <p style="margin:20px 0 0;font-size:12px;color:#B0A99F;line-height:1.8;word-break:break-all;text-align:center;">
    Button not working? Copy and paste this link into your browser:<br/>
    <a href="${url}" style="color:#C41230;text-decoration:underline;">${url}</a>
  </p>`;
}

function sectionHeading(text: string): string {
  return `<p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#C41230;letter-spacing:2.5px;text-transform:uppercase;">${text}</p>`;
}

// ─── 1. Email verification ────────────────────────────────────────────────────

export function emailVerificationHtml(data: {
  name:      string;
  verifyUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">Welcome, ${data.name}</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Your ${COMPANY_NAME} account is almost ready. Verify your email address below to unlock your account and begin exploring Japan.
    </p>

    <!-- Expiry notice -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:28px;background-color:#1B2847;border-radius:12px;">
      <tr>
        <td style="padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:rgba(200,168,75,0.7);letter-spacing:2.5px;text-transform:uppercase;">Link expires in</p>
                <p style="margin:0;font-size:34px;font-weight:700;color:#C8A84B;font-family:Georgia,'Times New Roman',serif;">24 hours</p>
              </td>
              <td style="text-align:right;vertical-align:middle;font-size:44px;line-height:1;">&#x23F0;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;border:1px solid #EDEBE7;border-radius:12px;">
      <tr>
        <td style="padding:24px 28px;">
          ${sectionHeading("What happens next")}
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr><td style="padding:7px 0;font-size:14px;color:#4A4540;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background-color:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:24px;vertical-align:middle;margin-right:12px;">1</span>Click the button below to verify your email
            </td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#4A4540;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background-color:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:24px;vertical-align:middle;margin-right:12px;">2</span>Your account is activated instantly
            </td></tr>
            <tr><td style="padding:7px 0;font-size:14px;color:#4A4540;line-height:1.5;">
              <span style="display:inline-block;width:24px;height:24px;background-color:#C41230;border-radius:50%;font-size:11px;font-weight:700;color:#fff;text-align:center;line-height:24px;vertical-align:middle;margin-right:12px;">3</span>Sign in and start exploring Japan &#x1F5FE;
            </td></tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Verify My Email Address", data.verifyUrl)}
    ${fallbackLink(data.verifyUrl)}

    <p style="margin:24px 0 0;font-size:12px;color:#C0B8B0;text-align:center;">Didn&rsquo;t create an account? You can safely ignore this email.</p>
  `;

  return baseTemplate({
    previewText: `${data.name}, one click to activate your ${COMPANY_NAME} account`,
    headerLabel: "Verify Your Email",
    headerIcon:  "&#x2709;",
    accentColor: "#C41230",
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
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">Your adventure is confirmed</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Hi ${data.customerName}, we&rsquo;re delighted to welcome you on this journey through Japan. Your booking is locked in — everything is ready.
    </p>

    <!-- Booking ref hero -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1B2847;border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:rgba(200,168,75,0.7);letter-spacing:2.5px;text-transform:uppercase;">Booking Reference</p>
                <p style="margin:0;font-size:30px;font-weight:700;color:#C8A84B;letter-spacing:4px;font-family:Georgia,'Times New Roman',serif;">${data.bookingRef}</p>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td style="background-color:#16A34A;border-radius:20px;padding:8px 18px;">
                      <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#10003;&nbsp; Confirmed</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Tour name -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:28px;border-left:4px solid #C8A84B;background-color:#FDFAF2;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#A07C20;letter-spacing:2px;text-transform:uppercase;">Your Tour</p>
          <p style="margin:0;font-size:19px;font-weight:700;color:#1B2847;">${data.tourTitle}</p>
        </td>
      </tr>
    </table>

    <!-- Details -->
    ${sectionHeading("Booking Details")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;">
      ${detailRow("Date", data.tourDate)}
      ${detailRow("Guests", `${data.numGuests} ${data.numGuests === 1 ? "person" : "people"}`)}
      ${detailRow("Payment Method", data.paymentMethod)}
    </table>

    <!-- Total paid -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#FBF9F6;border-radius:10px;border:1px solid #EDEBE7;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="font-size:14px;color:#9A948E;font-weight:500;">Total Paid</td>
              <td style="text-align:right;font-size:28px;font-weight:700;color:#C41230;font-family:Georgia,'Times New Roman',serif;">${data.totalAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:24px;background-color:#F6F8FF;border-radius:10px;border:1px solid #DDE4F5;">
      <tr>
        <td style="padding:18px 22px;font-size:14px;color:#4A5580;line-height:1.7;">
          &#x1F4AC;&nbsp; Need to make changes? Simply reply to this email &mdash; our team typically responds within 2 hours.
        </td>
      </tr>
    </table>
  `;

  return baseTemplate({
    previewText: `Booking confirmed: ${data.tourTitle} — Ref ${data.bookingRef}`,
    headerLabel: "Booking Confirmed",
    headerIcon:  "&#x2705;",
    accentColor: "#16A34A",
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
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New message from your guide</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Hi ${data.customerName}, <strong style="color:#1B2847;">${data.guideName}</strong> has sent you a message about your upcoming tour.
    </p>

    <!-- Tour reference -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;border:1px solid #EDEBE7;border-radius:12px;background-color:#FAFAF8;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#9A948E;letter-spacing:2px;text-transform:uppercase;">Your Tour</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1B2847;">${data.tourTitle}</p>
          <p style="margin:0;font-size:12px;color:#B0A99F;">Ref: ${data.bookingRef}</p>
        </td>
      </tr>
    </table>

    <!-- Message bubble -->
    ${sectionHeading(`${data.guideName} wrote`)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;background-color:#EEF3FF;border-radius:12px;border-left:4px solid #1B2847;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0;font-size:15px;color:#2A2520;line-height:1.85;font-style:italic;">&ldquo;${data.messagePreview}${data.messagePreview.length >= 200 ? "&hellip;" : ""}&rdquo;</p>
        </td>
      </tr>
    </table>

    ${ctaButton("Read Full Message", data.viewUrl, "#1B2847")}

    <p style="margin:20px 0 0;font-size:13px;color:#9A948E;text-align:center;">
      You can also reply directly from your bookings dashboard.
    </p>
  `;

  return baseTemplate({
    previewText: `${data.guideName}: new message about your ${data.tourTitle} tour`,
    headerLabel: "Message from Your Guide",
    headerIcon:  "&#x1F5E8;",
    accentColor: "#1B2847",
    body,
  });
}

// ─── 4. Wishlist discount alert ───────────────────────────────────────────────

export function wishlistDiscountHtml(data: {
  customerName:     string;
  tourTitle:        string;
  tourSlug:         string;
  discountCode:     string;
  discountLabel:    string;
  originalPrice:    string;
  discountedPrice?: string;
  validUntil?:      string;
  tourImageUrl?:    string;
}): string {
  const tourUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/tours/${data.tourSlug}`;

  const body = `
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">Price drop on your wishlist</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Hi ${data.customerName}, a tour you saved just received a special discount. Book now before it sells out!
    </p>

    <!-- Tour hero -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1B2847;border-radius:12px;margin-bottom:20px;">
      <tr>
        <td style="padding:32px 36px;">
          <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:rgba(200,168,75,0.7);letter-spacing:2.5px;text-transform:uppercase;">&#x2764; Your Wishlisted Tour</p>
          <p style="margin:0 0 20px;font-size:21px;font-weight:700;color:#ffffff;line-height:1.3;font-family:Georgia,'Times New Roman',serif;">${data.tourTitle}</p>
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="background-color:#C41230;border-radius:6px;padding:9px 20px;">
                <span style="font-size:20px;font-weight:700;color:#ffffff;">${data.discountLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Price comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;border:1px solid #EDEBE7;border-radius:12px;overflow:hidden;">
      <tr>
        <td width="50%" style="padding:22px;text-align:center;border-right:1px solid #EDEBE7;background-color:#FAFAF8;">
          <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#9A948E;letter-spacing:2px;text-transform:uppercase;">Was</p>
          <p style="margin:0;font-size:22px;font-weight:700;color:#C4BEB8;text-decoration:line-through;">${data.originalPrice}</p>
        </td>
        <td width="50%" style="padding:22px;text-align:center;background-color:#ffffff;">
          <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:#9A948E;letter-spacing:2px;text-transform:uppercase;">Now</p>
          <p style="margin:0;font-size:26px;font-weight:700;color:#C41230;font-family:Georgia,'Times New Roman',serif;">${data.discountedPrice ?? "See page"}</p>
        </td>
      </tr>
    </table>

    <!-- Promo code -->
    ${sectionHeading("Your Discount Code")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;background-color:#FDFAF2;border:2px dashed #C8A84B;border-radius:12px;">
      <tr>
        <td style="padding:26px;text-align:center;">
          <p style="margin:0 0 10px;font-size:32px;font-weight:700;color:#1B2847;letter-spacing:8px;font-family:'Courier New',Courier,monospace;">${data.discountCode}</p>
          ${data.validUntil ? `<p style="margin:0;font-size:12px;font-weight:600;color:#C41230;">&#x23F3;&nbsp; Expires ${data.validUntil}</p>` : ""}
        </td>
      </tr>
    </table>

    ${ctaButton("Book Now &amp; Save", tourUrl)}

    <p style="margin:20px 0 0;font-size:12px;color:#B0A99F;text-align:center;">Apply the code at checkout. Limited-time offer.</p>
  `;

  return baseTemplate({
    previewText: `${data.discountLabel} off your wishlisted tour: ${data.tourTitle}`,
    headerLabel: "Price Drop Alert",
    headerIcon:  "&#x1F4C9;",
    accentColor: "#C41230",
    body,
  });
}

// ─── 5. Password reset ────────────────────────────────────────────────────────

export function passwordResetHtml(data: {
  name:     string;
  resetUrl: string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">Reset your password</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Hi ${data.name}, we received a request to reset the password for your ${COMPANY_NAME} account. Use the button below to choose a new one.
    </p>

    <!-- Expiry card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1B2847;border-radius:12px;margin-bottom:32px;">
      <tr>
        <td style="padding:28px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:10px;font-weight:700;color:rgba(200,168,75,0.7);letter-spacing:2.5px;text-transform:uppercase;">This link expires in</p>
                <p style="margin:0;font-size:34px;font-weight:700;color:#C8A84B;font-family:Georgia,'Times New Roman',serif;">1 hour</p>
              </td>
              <td style="text-align:right;vertical-align:middle;font-size:44px;line-height:1;">&#x23F1;</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("Set New Password", data.resetUrl)}
    ${fallbackLink(data.resetUrl)}

    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:28px;background-color:#FEF2F2;border-radius:10px;border:1px solid #FECDD3;">
      <tr>
        <td style="padding:16px 22px;font-size:13px;color:#7A2A2A;line-height:1.7;text-align:center;">
          &#x26A0;&#xFE0F;&nbsp; If you didn&rsquo;t request this, ignore this email. Your password will <strong>not</strong> change.
        </td>
      </tr>
    </table>
  `;

  return baseTemplate({
    previewText: `Password reset request for your ${COMPANY_NAME} account`,
    headerLabel: "Password Reset",
    headerIcon:  "&#x1F510;",
    accentColor: "#B45309",
    body,
  });
}

// ─── 6. Admin: new booking notification ──────────────────────────────────────

export function adminNewBookingHtml(data: {
  bookingRef:    string;
  customerName:  string;
  customerEmail: string;
  tourTitle:     string;
  tourDate:      string;
  numGuests:     number;
  totalAmount:   string;
  paymentMethod: string;
}): string {
  const adminUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/admin/bookings`;

  const body = `
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New booking received</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      A new booking has been confirmed and payment collected. Review the details below.
    </p>

    <!-- Booking ref hero -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#1B2847;border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td>
                <p style="margin:0 0 6px;font-size:10px;font-weight:700;color:rgba(200,168,75,0.7);letter-spacing:2.5px;text-transform:uppercase;">Booking Reference</p>
                <p style="margin:0;font-size:30px;font-weight:700;color:#C8A84B;letter-spacing:4px;font-family:Georgia,'Times New Roman',serif;">${data.bookingRef}</p>
              </td>
              <td style="text-align:right;vertical-align:middle;">
                <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                  <tr>
                    <td style="background-color:#16A34A;border-radius:20px;padding:8px 18px;">
                      <span style="font-size:12px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#10003;&nbsp; Payment Received</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Tour banner -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:28px;border-left:4px solid #C8A84B;background-color:#FDFAF2;">
      <tr>
        <td style="padding:18px 22px;">
          <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#A07C20;letter-spacing:2px;text-transform:uppercase;">Tour</p>
          <p style="margin:0;font-size:19px;font-weight:700;color:#1B2847;">${data.tourTitle}</p>
        </td>
      </tr>
    </table>

    <!-- Details -->
    ${sectionHeading("Booking Details")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;">
      ${detailRow("Customer", data.customerName)}
      ${detailRow("Email", data.customerEmail)}
      ${detailRow("Date", data.tourDate)}
      ${detailRow("Guests", `${data.numGuests} ${data.numGuests === 1 ? "person" : "people"}`)}
      ${detailRow("Payment Method", data.paymentMethod)}
    </table>

    <!-- Total -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#F0FAF3;border-radius:10px;border:1px solid #BBF0CC;">
      <tr>
        <td style="padding:20px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="font-size:14px;color:#4A7A5A;font-weight:600;">Total Collected</td>
              <td style="text-align:right;font-size:28px;font-weight:700;color:#16A34A;font-family:Georgia,'Times New Roman',serif;">${data.totalAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${ctaButton("View in Admin Panel", adminUrl, "#1B2847")}
  `;

  return baseTemplate({
    previewText: `New booking ${data.bookingRef} — ${data.tourTitle} (${data.totalAmount})`,
    headerLabel: "New Booking",
    headerIcon:  "&#x1F4CB;",
    accentColor: "#16A34A",
    body,
  });
}

// ─── 7. Admin: new customer message notification ──────────────────────────────

export function adminNewMessageHtml(data: {
  customerName:   string;
  bookingRef:     string;
  tourTitle:      string;
  messagePreview: string;
  chatUrl:        string;
}): string {
  const body = `
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">New customer message</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      <strong style="color:#1B2847;">${data.customerName}</strong> has sent a message about their booking. Reply from the admin panel.
    </p>

    <!-- Booking badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;border:1px solid #EDEBE7;border-radius:12px;background-color:#FAFAF8;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 3px;font-size:10px;font-weight:700;color:#9A948E;letter-spacing:2px;text-transform:uppercase;">Booking</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1B2847;">${data.tourTitle}</p>
          <p style="margin:0;font-size:12px;color:#B0A99F;">Ref: ${data.bookingRef}</p>
        </td>
      </tr>
    </table>

    <!-- Message bubble -->
    ${sectionHeading(`${data.customerName} wrote`)}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;background-color:#EEF3FF;border-radius:12px;border-left:4px solid #1B2847;">
      <tr>
        <td style="padding:24px 28px;">
          <p style="margin:0;font-size:15px;color:#2A2520;line-height:1.85;font-style:italic;">&ldquo;${data.messagePreview}${data.messagePreview.length >= 200 ? "&hellip;" : ""}&rdquo;</p>
        </td>
      </tr>
    </table>

    ${ctaButton("Reply in Admin Chat", data.chatUrl, "#1B2847")}
  `;

  return baseTemplate({
    previewText: `${data.customerName} sent a message — ${data.tourTitle} (${data.bookingRef})`,
    headerLabel: "Customer Message",
    headerIcon:  "&#x1F4AC;",
    accentColor: "#1B2847",
    body,
  });
}

// ─── 8. Deal alert (newsletter subscribers) ───────────────────────────────────

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
    <p style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1B2847;line-height:1.2;font-family:Georgia,'Times New Roman',serif;">An exclusive deal, just for you</p>
    <p style="margin:0 0 32px;font-size:15px;color:#6B6560;line-height:1.8;">
      Hi ${data.customerName}, as a ${COMPANY_NAME} subscriber you get first access to our best offers &mdash; before the general public.
    </p>

    <!-- Tour hero card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#C41230;border-radius:12px;margin-bottom:24px;">
      <tr>
        <td style="padding:36px;">
          <p style="margin:0 0 5px;font-size:10px;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:2.5px;text-transform:uppercase;">Featured Tour</p>
          <p style="margin:0 0 14px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.35;font-family:Georgia,'Times New Roman',serif;">${data.tourTitle}</p>
          ${data.shortDescription ? `<p style="margin:0 0 22px;font-size:14px;color:rgba(255,255,255,0.78);line-height:1.7;">${data.shortDescription}</p>` : ""}
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="background-color:#C8A84B;border-radius:6px;padding:10px 22px;">
                <span style="font-size:22px;font-weight:700;color:#1B2847;">${data.discountLabel}</span>
              </td>
              <td style="padding-left:16px;font-size:14px;color:rgba(255,255,255,0.5);text-decoration:line-through;vertical-align:middle;">was ${data.originalPrice}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Promo code -->
    ${sectionHeading("Subscriber Exclusive Code")}
    <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:8px;background-color:#FDFAF2;border:2px dashed #C8A84B;border-radius:12px;">
      <tr>
        <td style="padding:26px;text-align:center;">
          <p style="margin:0 0 10px;font-size:32px;font-weight:700;color:#1B2847;letter-spacing:8px;font-family:'Courier New',Courier,monospace;">${data.discountCode}</p>
          ${data.validUntil ? `<p style="margin:0;font-size:12px;font-weight:600;color:#C41230;">&#x23F3;&nbsp; Valid until ${data.validUntil}</p>` : ""}
        </td>
      </tr>
    </table>

    ${ctaButton("Claim This Deal", tourUrl)}

    <p style="margin:28px 0 0;font-size:12px;color:#B0A99F;text-align:center;line-height:1.8;">
      You&rsquo;re receiving this because you subscribed to ${COMPANY_NAME} deals.<br/>
      <a href="${data.unsubscribeUrl}" style="color:#9A948E;text-decoration:underline;">Unsubscribe</a>
    </p>
  `;

  return baseTemplate({
    previewText: `Members-only: ${data.discountLabel} on ${data.tourTitle}`,
    headerLabel: "Members-Only Deal",
    headerIcon:  "&#x1F381;",
    accentColor: "#C41230",
    body,
  });
}
