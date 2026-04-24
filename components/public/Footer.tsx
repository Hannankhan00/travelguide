import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, ArrowRight } from "lucide-react";
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_PHONE, COMPANY_WHATSAPP } from "@/lib/constants";

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
                href={`https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="w-10 h-10 rounded-xl bg-white/8 hover:bg-[#25D366] transition-colors flex items-center justify-center border border-white/10"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="size-5 text-white/70">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
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
              {COMPANY_WHATSAPP && (
                <li>
                  <a
                    href={`https://wa.me/${COMPANY_WHATSAPP.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-white/55 hover:text-white transition-colors"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="size-4 shrink-0 text-[#25D366]">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    {COMPANY_WHATSAPP}
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

            {/* Trustpilot TrustBox */}
            <div className="mt-8">
              <h4 className="font-semibold text-xs tracking-widest uppercase text-white/35 mb-4">
                Trustpilot Reviews
              </h4>
              <div 
                className="trustpilot-widget" 
                data-locale="en-US" 
                data-template-id="56278e9abfbbba0bdcd568bc" 
                data-businessunit-id="69e422b612f246df35d09ea8" 
                data-style-height="52px" 
                data-style-width="100%" 
                data-style-alignment="left"
                data-token="a94f0544-3bce-4965-b5b5-9e4e0836f8ad"
              >
                <a href="https://www.trustpilot.com/review/gotripjapan.com" target="_blank" rel="noopener noreferrer">
                  Trustpilot
                </a>
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
