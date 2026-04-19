import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, Share2, Tv, Play, ArrowRight } from "lucide-react";
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
      <div className="bg-gradient-to-r from-[#185FA5] to-[#0C447C]">
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
              {[
                { Icon: Share2, label: "Instagram", href: "#" },
                { Icon: Tv,     label: "Facebook", href: "https://www.facebook.com/GoTripJapan" },
                { Icon: Play,   label: "YouTube", href: "#"   },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href !== "#" ? "_blank" : undefined}
                  rel={href !== "#" ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/8 hover:bg-[#185FA5] transition-colors flex items-center justify-center border border-white/10"
                >
                  <Icon className="size-4 text-white/70" />
                </a>
              ))}
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
