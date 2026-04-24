import { ContactForm } from "@/components/public/ContactForm";
import { COMPANY_EMAIL, COMPANY_PHONE, COMPANY_NAME, COMPANY_WHATSAPP } from "@/lib/constants";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

export const metadata = {
  title: `Contact Us | ${COMPANY_NAME}`,
  description: "Get in touch with our team. We are here to help you plan your perfect Japan experience.",
};

const FAQS = [
  {
    q: "How far in advance should I book?",
    a: "We recommend booking at least 2 to 4 weeks ahead, especially during cherry blossom and autumn foliage seasons.",
  },
  {
    q: "Can I customise a tour for my group?",
    a: "Absolutely. We offer private and tailor-made experiences. Mention your requirements in the message and we will put together a bespoke itinerary.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Full refund for cancellations made 7 or more days before the tour. Within 7 days, a 50% fee applies. No-shows are non-refundable.",
  },
  {
    q: "Do your guides speak English?",
    a: "Yes, all our guides are fluent English speakers. Many also speak Mandarin, Spanish, or French.",
  },
];

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen pt-14">

      {/* Page header */}
      <div className="border-b border-[#E4E0D9] bg-[#F8F7F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#185FA5] mb-3">
            Get in Touch
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-[#111] mb-4 leading-tight">
            We would love to hear from you
          </h1>
          <p className="text-[#7A746D] text-lg max-w-xl mx-auto">
            Whether you have a question about a tour, need help with a booking, or simply want to say hello, our team is here.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

          {/* Left: contact info + quick FAQs */}
          <div className="lg:col-span-2 space-y-8">

            {/* Info cards */}
            <div className="space-y-3">
              {[
                {
                  icon: MessageCircle,
                  label: "WhatsApp",
                  value: COMPANY_WHATSAPP,
                  sub: "Instant chat support",
                  href: `https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, "")}`,
                },
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
                        sub: "Mon to Sat, 9 am to 6 pm JST",
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
                  className="bg-white rounded-2xl border border-[#E4E0D9] p-5 flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EEF4FB] flex items-center justify-center shrink-0">
                    <Icon className="size-5 text-[#185FA5]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#A8A29E] mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="font-semibold text-[#111] hover:text-[#185FA5] transition-colors text-sm">
                        {value}
                      </a>
                    ) : (
                      <p className="font-semibold text-[#111] text-sm">{value}</p>
                    )}
                    <p className="text-xs text-[#A8A29E] mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick FAQs */}
            <div>
              <h2 className="font-display text-lg font-bold text-[#111] mb-4">Common questions</h2>
              <div className="space-y-3">
                {FAQS.map((faq) => (
                  <div key={faq.q} className="bg-[#F8F7F5] rounded-xl border border-[#E4E0D9] p-5">
                    <p className="font-semibold text-[#111] text-sm mb-1.5">{faq.q}</p>
                    <p className="text-sm text-[#7A746D] leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-[#A8A29E]">
                More questions?{" "}
                <a href="/faq" className="text-[#185FA5] font-semibold hover:underline">
                  Visit our full FAQ page
                </a>
              </p>
            </div>

          </div>

          {/* Right: form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-[#E4E0D9] p-8 md:p-10">
              <h2 className="font-display text-2xl font-bold text-[#111] mb-1">Send us a message</h2>
              <p className="text-[#7A746D] text-sm mb-8">
                Fill in the form and a member of our team will get back to you shortly.
              </p>
              <ContactForm />
            </div>
          </div>

        </div>
      </div>
      
      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, "")}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[100] w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300 animate-bounce-subtle"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="size-8">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
