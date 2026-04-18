import { COMPANY_NAME, COMPANY_EMAIL } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy | ${COMPANY_NAME}`,
  description: "Learn how we collect, use, and protect your personal data.",
};

const EFFECTIVE_DATE = "April 19, 2026";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* Hero */}
      <section className="bg-[#1B2847] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C41230] font-semibold text-sm uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold font-serif mb-3">Privacy Policy</h1>
          <p className="text-white/60 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto space-y-10">

          <Intro name={COMPANY_NAME} email={COMPANY_EMAIL} />

          <Section title="1. Information We Collect">
            <p>We collect information you provide directly and information generated when you use our services.</p>
            <SubHeading>Account &amp; Booking Data</SubHeading>
            <ul>
              <li>Name, email address, and password (hashed — never stored in plain text)</li>
              <li>Phone number and nationality (optional, for booking purposes)</li>
              <li>Passport or ID details for international tours where legally required</li>
              <li>Billing address and payment details — <strong>we do not store card numbers</strong>; payments are processed securely by Stripe</li>
            </ul>
            <SubHeading>Passenger Information</SubHeading>
            <ul>
              <li>Names, ages, and dietary requirements for each passenger on your booking</li>
            </ul>
            <SubHeading>Usage &amp; Technical Data</SubHeading>
            <ul>
              <li>IP address, browser type, and device identifiers</li>
              <li>Pages visited, links clicked, and session duration (collected via server logs)</li>
              <li>Authentication tokens stored in secure HTTP-only cookies</li>
            </ul>
            <SubHeading>Communications</SubHeading>
            <ul>
              <li>Messages sent through our in-app chat or contact form</li>
              <li>Email correspondence with our team</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul>
              <li><strong>Fulfil your booking</strong> — confirm reservations, send itineraries, and coordinate with tour guides</li>
              <li><strong>Process payments</strong> — securely charge and refund via Stripe</li>
              <li><strong>Account management</strong> — authenticate you, reset passwords, and maintain your booking history</li>
              <li><strong>Customer support</strong> — respond to questions, complaints, and in-app chat messages</li>
              <li><strong>Service notifications</strong> — booking confirmations, reminders, and tour updates</li>
              <li><strong>Promotional emails</strong> — deal alerts and offers, <strong>only if you opted in</strong>. You can unsubscribe at any time</li>
              <li><strong>Legal compliance</strong> — meet tax, accounting, and regulatory obligations</li>
              <li><strong>Fraud prevention</strong> — detect and block suspicious activity</li>
            </ul>
            <p className="mt-2">We do <strong>not</strong> sell, rent, or trade your personal data to third parties for their marketing purposes.</p>
          </Section>

          <Section title="3. Cookies &amp; Tracking">
            <p>We use a small number of essential cookies:</p>
            <ul>
              <li><strong>Session cookie</strong> — keeps you logged in across page loads (HTTP-only, secure)</li>
              <li><strong>CSRF token</strong> — protects form submissions from cross-site attacks</li>
            </ul>
            <p>We do not use advertising cookies, third-party tracking pixels, or sell behavioural data to ad networks.</p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We share your data only where necessary:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing. Stripe is PCI-DSS compliant. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C41230] hover:underline">stripe.com/privacy</a></li>
              <li><strong>Google OAuth</strong> — if you sign in with Google, Google authenticates you. We receive only your name and email. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#C41230] hover:underline">Google's Privacy Policy</a></li>
              <li><strong>Email provider</strong> — to send transactional and booking emails on our behalf</li>
              <li><strong>Tour guides &amp; local operators</strong> — names and group size for confirmed bookings only</li>
              <li><strong>Law enforcement</strong> — if required by a valid legal order</li>
            </ul>
          </Section>

          <Section title="5. Data Retention">
            <ul>
              <li><strong>Account data</strong> — retained while your account is active. You may request deletion at any time</li>
              <li><strong>Booking records</strong> — kept for 7 years to comply with financial and tax regulations</li>
              <li><strong>Chat messages</strong> — retained for 12 months, then automatically deleted</li>
              <li><strong>Marketing preferences</strong> — removed immediately upon unsubscribe</li>
            </ul>
          </Section>

          <Section title="6. Your Rights">
            <p>Depending on your location, you have the right to:</p>
            <ul>
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — ask us to fix inaccurate or incomplete information</li>
              <li><strong>Deletion</strong> — request that we erase your account and personal data</li>
              <li><strong>Portability</strong> — receive your data in a structured, machine-readable format</li>
              <li><strong>Opt-out</strong> — unsubscribe from marketing emails via the link in any email, or from your account settings</li>
              <li><strong>Withdraw consent</strong> — at any time, where processing is based on consent</li>
            </ul>
            <p>To exercise any of these rights, email us at <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#C41230] hover:underline">{COMPANY_EMAIL}</a>. We will respond within 30 days.</p>
          </Section>

          <Section title="7. Security">
            <p>We take reasonable technical and organisational measures to protect your data:</p>
            <ul>
              <li>Passwords are hashed using bcrypt — we cannot read your password</li>
              <li>All data is transmitted over HTTPS/TLS</li>
              <li>Database access is restricted to authorised server processes only</li>
              <li>Payment data is handled entirely by Stripe and never touches our servers</li>
              <li>Session tokens are stored in secure, HTTP-only cookies</li>
            </ul>
            <p>No system is 100% secure. If you suspect unauthorised access to your account, contact us immediately.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>Our services are not directed at children under 16. We do not knowingly collect personal data from anyone under 16. If you believe we have done so inadvertently, please contact us and we will delete it promptly.</p>
          </Section>

          <Section title="9. Third-Party Links">
            <p>Our site may link to external websites (e.g., Google Maps, attraction pages). We are not responsible for the privacy practices of those sites. Please review their policies independently.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this policy from time to time. When we do, we will update the effective date above and, for material changes, notify you by email or a prominent notice on our site. Continued use of our services after the change constitutes acceptance.</p>
          </Section>

          <Section title="11. Contact Us">
            <p>If you have any questions about this policy or how we handle your data, please reach out:</p>
            <address className="not-italic mt-3 space-y-1 text-[#545454]">
              <p className="font-semibold text-[#111]">{COMPANY_NAME}</p>
              <p>
                <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#C41230] hover:underline">
                  {COMPANY_EMAIL}
                </a>
              </p>
            </address>
          </Section>

        </div>
      </section>
    </main>
  );
}

/* ── Sub-components ───────────────────────────────────────────────────────── */

function Intro({ name, email }: { name: string; email: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4E0D9] p-6 text-[#545454] text-sm leading-relaxed">
      <p>
        <strong className="text-[#111]">{name}</strong> ("we", "us", "our") operates this website and the tour booking platform accessible through it. This Privacy Policy explains what personal data we collect, why we collect it, how we use it, and your rights in relation to it.
      </p>
      <p className="mt-3">
        If you have questions, contact us at{" "}
        <a href={`mailto:${email}`} className="text-[#C41230] hover:underline">{email}</a>.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1B2847] mb-4 pb-2 border-b border-[#E4E0D9]">{title}</h2>
      <div className="text-[#545454] text-sm leading-relaxed space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-[#111] [&_strong]:font-semibold">
        {children}
      </div>
    </div>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-[#1B2847] mt-4 mb-1">{children}</p>;
}
