import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_PHONE } from "@/lib/constants";

const TOUR_LINKS = [
  { label: "All Tours",        href: "/tours"                         },
  { label: "Cultural Tours",   href: "/tours?category=CULTURAL"       },
  { label: "Food & Drink",     href: "/tours?category=FOOD_AND_DRINK" },
  { label: "Nature & Scenery", href: "/tours?category=NATURE"         },
  { label: "Adventure",        href: "/tours?category=ADVENTURE"      },
  { label: "Private Tours",    href: "/tours?category=PRIVATE"        },
];

const SUPPORT_LINKS = [
  { label: "FAQ",              href: "/faq"          },
  { label: "Booking Policy",   href: "/policy"       },
  { label: "Privacy Policy",   href: "/privacy"      },
  { label: "Terms of Service", href: "/terms"        },
  { label: "Contact Us",       href: "/contact"      },
];

export function Footer() {
  return (
    <footer className="bg-[#0C447C] text-white">
      {/* Newsletter / CTA band */}
      <div className="bg-linear-to-r from-[#185FA5] to-[#0C447C]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-2xl font-bold text-white mb-1.5">
              Ready to explore Japan?
            </h3>
            <p className="text-white/60 text-sm">
              Get personalized recommendations and exclusive deals delivered to your inbox.
            </p>
          </div>
          <Link
            href="/tours"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-[#EF9F27] text-[#111] font-bold text-sm hover:bg-[#FFB74D] transition-colors shadow-lg"
          >
            Browse All Tours
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-5">
              <div className="bg-white rounded-xl p-2">
                <Image
                  src="/asstes/footer.PNG"
                  alt="GoTripJapan"
                  width={160}
                  height={160}
                  className="h-24 w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-white/45 text-sm leading-relaxed mb-6">
              Crafting unforgettable Japan experiences since 2016. Every tour is
              designed to help you discover the real Japan.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/g.otripjapan/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-[#185FA5] transition-colors flex items-center justify-center border border-white/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-white/70">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                </svg>
              </a>
              <a
                href="https://www.facebook.com/GoTripJapan"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-[#185FA5] transition-colors flex items-center justify-center border border-white/10"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 text-white/70">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Discover column */}
          <div>
            <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-5">
              Discover
            </h4>
            <ul className="space-y-3">
              {TOUR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-5">
              Support
            </h4>
            <ul className="space-y-3">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-5">
              Contact
            </h4>
            <ul className="space-y-3.5">
              {COMPANY_EMAIL && (
                <li>
                  <a
                    href={`mailto:${COMPANY_EMAIL}`}
                    className="flex items-center gap-3 text-sm text-white/55 hover:text-white transition-colors"
                  >
                    <Mail className="size-4 shrink-0 text-[#EF9F27]" />
                    {COMPANY_EMAIL}
                  </a>
                </li>
              )}
              {COMPANY_PHONE && (
                <li>
                  <a
                    href={`tel:${COMPANY_PHONE}`}
                    className="flex items-center gap-3 text-sm text-white/55 hover:text-white transition-colors"
                  >
                    <Phone className="size-4 shrink-0 text-[#EF9F27]" />
                    {COMPANY_PHONE}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 text-sm text-white/55">
                <MapPin className="size-4 shrink-0 text-[#EF9F27] mt-0.5" />
                <span>Tokyo, Japan<br />Available worldwide</span>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-8">
              <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-4">
                Payment Methods
              </h4>
              <div className="flex flex-wrap items-center gap-2">
                <div className="bg-white rounded px-2.5 py-1.5 flex items-center justify-center w-12 h-8" aria-label="PayPal">
                  <svg viewBox="0 0 24 24" className="h-4 w-auto">
                    <path fill="#003087" d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
                    <path fill="#0079C1" d="M21.158 6.534c-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106a.64.64 0 0 1-.633.541H9.91c.36 0 .664-.265.717-.621l1.106-7.009c.083-.518.527-.9 1.05-.9h2.19c4.298 0 7.664-1.747 8.647-6.797.03-.15.054-.294.077-.437z"/>
                    <path fill="#00457C" d="M11.016 14.124h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106H9.91c.36 0 .664-.265.717-.621l1.106-7.009c.083-.518.527-.9 1.05-.9z"/>
                  </svg>
                </div>
                <div className="bg-white rounded px-2.5 py-1.5 flex items-center justify-center w-12 h-8" aria-label="Visa">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-auto">
                    <path fill="#1A1F71" d="M9.112 8.262L5.97 15.758H3.92L2.374 9.775c-.094-.368-.175-.503-.461-.658C1.447 8.864.677 8.627 0 8.479l.046-.217h3.3a.904.904 0 01.894.764l.817 4.338 2.018-5.102zm8.033 5.049c.008-1.979-2.736-2.088-2.717-2.972.006-.269.262-.555.822-.628a3.66 3.66 0 011.913.336l.34-1.59a5.207 5.207 0 00-1.814-.333c-1.917 0-3.266 1.02-3.278 2.479-.012 1.079.963 1.68 1.698 2.04.756.367 1.01.603 1.006.931-.005.504-.602.725-1.16.734-.975.015-1.54-.263-1.992-.473l-.351 1.642c.453.208 1.289.39 2.156.398 2.037 0 3.37-1.006 3.377-2.564m5.061 2.447H24l-1.565-7.496h-1.656a.883.883 0 00-.826.55l-2.909 6.946h2.036l.405-1.12h2.488zm-2.163-2.656l1.02-2.815.588 2.815zm-8.16-4.84l-1.603 7.496H8.34l1.605-7.496z"/>
                  </svg>
                </div>
                <div className="bg-white rounded px-2.5 py-1.5 flex items-center justify-center w-12 h-8" aria-label="Mastercard">
                  <svg viewBox="0 0 44 28" className="h-4.5 w-auto">
                    <circle cx="15.5" cy="14" r="14" fill="#EB001B"/>
                    <circle cx="28.5" cy="14" r="14" fill="#F79E1B"/>
                    <path d="M22 26.13A13.9 13.9 0 0 0 28.5 14 13.9 13.9 0 0 0 22 1.87 13.9 13.9 0 0 0 15.5 14 13.9 13.9 0 0 0 22 26.13z" fill="#FF5F00"/>
                  </svg>
                </div>
                <div className="bg-white rounded px-2.5 py-1.5 flex items-center justify-center w-12 h-8" aria-label="Stripe">
                  <svg viewBox="0 0 24 24" className="h-4 w-auto">
                    <path fill="#635BFF" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-sm">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="text-white/15 text-xs">
            Crafted with care in Tokyo 🗼
          </p>
        </div>
      </div>
    </footer>
  );
}
