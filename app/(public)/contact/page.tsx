import { ContactForm } from "@/components/public/ContactForm";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_NAME } from "@/lib/constants";
import { Mail, Phone, MapPin, Clock, MessageCircle, Star } from "lucide-react";

export const metadata = {
  title: "Contact Us | " + COMPANY_NAME,
  description: "Get in touch with our team. We are here to help you plan your perfect Japan experience.",
};

const FAQS = [
  {
    q: "How far in advance should I book?",
    a: "We recommend booking at least 2–4 weeks ahead, especially for popular tours during cherry blossom and autumn foliage seasons.",
  },
  {
    q: "Can I customise a tour for my group?",
    a: "Absolutely. We offer private and tailor-made experiences. Mention your requirements in the message and we will put together a bespoke itinerary.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Full refund for cancellations made 7+ days before the tour. Within 7 days, a 50% fee applies. No-shows are non-refundable.",
  },
  {
    q: "Do your guides speak English?",
    a: "Yes — all our guides are fluent English speakers, and many also speak Mandarin, Spanish, or French.",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-[#F8F9FF] min-h-screen pt-24 md:pt-28">

      {/* ── Hero banner ─────────────────────────────── */}
      <div className="relative bg-[#0C447C] overflow-hidden">
        {/* subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 md:py-20">
          <p className="text-[#EF9F27] font-bold text-xs uppercase tracking-widest mb-3">
            Get in touch
          </p>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white leading-tight mb-4">
            We would love to hear<br className="hidden md:block" /> from you
          </h1>
          <p className="text-white/70 text-lg max-w-xl">
            Whether you have a question about a tour, need help with a booking, or simply want to say hello — our team is here.
          </p>

          {/* trust badges */}
          <div className="flex flex-wrap items-center gap-6 mt-8">
            {[
              { label: "Reply within 24 h", icon: Clock },
              { label: "Friendly team", icon: MessageCircle },
              { label: "Rated 4.9 / 5", icon: Star },
            ].map(({ label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 text-white/60 text-sm">
                <Icon className="size-4 text-[#EF9F27]" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main content ────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* ── Left: contact info ─────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* Info cards */}
            <div className="space-y-4">
              {[
                {
                  icon: Mail,
                  label: "Email us",
                  value: COMPANY_EMAIL,
                  sub: "Best for detailed enquiries",
                  href: "mailto:" + COMPANY_EMAIL,
                },
                ...(COMPANY_PHONE
                  ? [
                      {
                        icon: Phone,
                        label: "Call us",
                        value: COMPANY_PHONE,
                        sub: "Mon – Sat, 9 am – 6 pm JST",
                        href: "tel:" + COMPANY_PHONE,
                      },
                    ]
                  : []),
                {
                  icon: MapPin,
                  label: "Based in",
                  value: "Tokyo, Japan",
                  sub: "Tours available nationwide",
                  href: null,
                },
                {
                  icon: Clock,
                  label: "Response time",
                  value: "Within 24 hours",
                  sub: "Usually much faster",
                  href: null,
                },
              ].map(({ icon: Icon, label, value, sub, href }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-[#E7E8EE] p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FB] flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-[#185FA5]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#7A746D] mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="font-semibold text-[#111] hover:text-[#185FA5] transition-colors text-sm">
                        {value}
                      </a>
                    ) : (
                      <p className="font-semibold text-[#111] text-sm">{value}</p>
                    )}
                    <p className="text-xs text-[#7A746D] mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-xl font-bold font-display text-[#111] mb-5">Common questions</h2>
              <div className="space-y-4">
                {FAQS.map((faq) => (
                  <div key={faq.q} className="bg-white rounded-xl border border-[#E7E8EE] p-5 shadow-sm">
                    <p className="font-semibold text-[#111] text-sm mb-1.5">{faq.q}</p>
                    <p className="text-sm text-[#545454] leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: form ────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E7E8EE] shadow-sm p-8 md:p-10">
              <h2 className="text-2xl font-bold font-display text-[#111] mb-1">Send us a message</h2>
              <p className="text-[#7A746D] text-sm mb-8">
                Fill in the form and a member of our team will get back to you shortly.
              </p>
              <ContactForm />
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
