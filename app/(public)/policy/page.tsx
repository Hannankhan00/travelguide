import { COMPANY_NAME, COMPANY_EMAIL } from "@/lib/constants";

export const metadata = {
  title: `Booking Policy | ${COMPANY_NAME}`,
  description: "Read our booking, cancellation, payment, and refund policies before reserving your tour.",
};

const EFFECTIVE_DATE = "April 19, 2026";

export default function BookingPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6]">
      {/* Hero */}
      <section className="bg-[#1B2847] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C41230] font-semibold text-sm uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-4xl font-bold font-serif mb-3">Booking Policy</h1>
          <p className="text-white/60 text-sm">Effective date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-4">
        <div className="max-w-3xl mx-auto space-y-10">

          {/* Intro */}
          <div className="bg-white rounded-2xl border border-[#E4E0D9] p-6 text-[#545454] text-sm leading-relaxed">
            <p>
              Please read this Booking Policy carefully before making a reservation with{" "}
              <strong className="text-[#111]">{COMPANY_NAME}</strong>. By completing a booking you confirm that
              you have read, understood, and agreed to the terms below.
            </p>
            <p className="mt-3">
              Questions? Email us at{" "}
              <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#C41230] hover:underline">{COMPANY_EMAIL}</a>.
            </p>
          </div>

          <Section title="1. Making a Reservation">
            <ul>
              <li>Bookings can be made through our website after creating a free account.</li>
              <li>A booking is only confirmed once you receive a <strong>Booking Confirmation</strong> email from us.</li>
              <li>All passengers on the booking must be listed with accurate names and ages at the time of booking.</li>
              <li>We reserve the right to decline or cancel a booking that contains inaccurate or fraudulent information.</li>
            </ul>
          </Section>

          <Section title="2. Pricing &amp; Payment">
            <SubHeading>Prices</SubHeading>
            <ul>
              <li>All prices are displayed in the currency shown on the tour page and are inclusive of applicable taxes unless stated otherwise.</li>
              <li>Prices are per person unless explicitly stated as a group price.</li>
              <li>Prices are subject to change until the moment of booking confirmation. We honour the price shown at the time of your confirmed booking.</li>
            </ul>
            <SubHeading>Payment Methods</SubHeading>
            <ul>
              <li><strong>Credit / Debit Card</strong> — processed securely via Stripe. Full payment is taken at time of booking.</li>
              <li><strong>Bank Transfer</strong> — a deposit of 30% is required within 48 hours of receiving your invoice to hold the booking. The remaining balance is due 7 days before the tour date.</li>
            </ul>
            <SubHeading>Discount Codes</SubHeading>
            <ul>
              <li>Discount codes must be entered at checkout. They cannot be applied retroactively.</li>
              <li>Codes are non-transferable, cannot be combined, and have no cash value.</li>
            </ul>
          </Section>

          <Section title="3. Cancellation Policy">
            <p>Cancellations must be submitted in writing to <a href={`mailto:${COMPANY_EMAIL}`} className="text-[#C41230] hover:underline">{COMPANY_EMAIL}</a> or via your account dashboard.</p>

            <div className="mt-4 rounded-xl overflow-hidden border border-[#E4E0D9] text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8F7F5] text-[#7A746D] font-semibold">
                    <th className="px-4 py-3 text-left">Notice given before tour date</th>
                    <th className="px-4 py-3 text-left">Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E4E0D9] text-[#545454]">
                  <tr>
                    <td className="px-4 py-3">14 days or more</td>
                    <td className="px-4 py-3 text-[#15803D] font-semibold">100% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">7 – 13 days</td>
                    <td className="px-4 py-3 text-[#B45309] font-semibold">50% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">2 – 6 days</td>
                    <td className="px-4 py-3 text-[#B91C1C] font-semibold">25% refund</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Less than 48 hours / No-show</td>
                    <td className="px-4 py-3 text-[#B91C1C] font-semibold">No refund</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="mt-3">Refunds are returned to the original payment method within 5–10 business days.</p>
          </Section>

          <Section title="4. Tour Amendments">
            <ul>
              <li>You may request a date change or passenger amendment up to <strong>7 days before the tour</strong>, subject to availability, by contacting us.</li>
              <li>Name corrections (e.g. spelling) can be made at any time at no charge.</li>
              <li>Amendments requested less than 7 days before the tour date may be treated as a cancellation and re-booking.</li>
            </ul>
          </Section>

          <Section title="5. Cancellation by Us">
            <p>We reserve the right to cancel or reschedule a tour in the following circumstances:</p>
            <ul>
              <li>Minimum participant numbers are not met (typically 48 hours' notice will be given)</li>
              <li>Severe weather, natural disaster, or force majeure events</li>
              <li>Safety concerns identified by our guides or local authorities</li>
            </ul>
            <p>In the event of a cancellation by us, you will receive a <strong>full refund</strong> or the option to reschedule at no extra cost. We are not liable for any travel or accommodation costs incurred as a result of our cancellation.</p>
          </Section>

          <Section title="6. Group Bookings">
            <ul>
              <li>Groups of 8 or more persons may qualify for a group discount — contact us before booking.</li>
              <li>A single lead passenger is responsible for the full booking and all communications.</li>
              <li>Full passenger details for all group members must be provided at least 7 days before the tour.</li>
            </ul>
          </Section>

          <Section title="7. Conduct &amp; Safety">
            <ul>
              <li>All participants must follow the instructions of our guides at all times.</li>
              <li>We reserve the right to remove any participant whose behaviour endangers themselves or others. No refund will be issued in this case.</li>
              <li>Participants must disclose any medical conditions, mobility limitations, or dietary requirements at time of booking.</li>
              <li>Children under 18 must be accompanied by a responsible adult at all times.</li>
            </ul>
          </Section>

          <Section title="8. Liability">
            <ul>
              <li>Participation in tours involves inherent risks. You accept these risks by booking.</li>
              <li>We carry appropriate public liability insurance for all guided tours.</li>
              <li>We strongly recommend all travellers take out personal travel insurance covering cancellation, medical expenses, and loss of belongings before travelling.</li>
              <li>We are not liable for loss of personal belongings during a tour.</li>
            </ul>
          </Section>

          <Section title="9. Photography &amp; Media">
            <p>Our guides and photographers may capture photos or video during tours for use in our marketing materials. If you do not wish to be photographed, please inform your guide at the start of the tour. We will respect your request promptly.</p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>We may update this policy from time to time. The effective date at the top of this page will reflect the most recent revision. For bookings already confirmed, the policy version in effect at the time of booking applies.</p>
          </Section>

          <Section title="11. Contact">
            <p>For questions about your booking or this policy:</p>
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
