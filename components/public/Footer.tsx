import Link from "next/link";
import Image from "next/image";
import { MapPin, Mail, Phone, Share2, Tv, Play } from "lucide-react";
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_PHONE } from "@/lib/constants";

const TOUR_LINKS = [
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
    <footer className="bg-secondary text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="bg-white rounded-xl p-2">
                <Image
                  src="/asstes/footer.PNG"
                  alt="GoTripJapan"
                  width={120}
                  height={120}
                  className="h-20 w-auto object-contain"
                />
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Crafting unforgettable Japan experiences since 2016. Every tour is
              designed to help you discover the real Japan.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {[
                { Icon: Share2, label: "Instagram" },
                { Icon: Tv,    label: "Facebook"  },
                { Icon: Play,  label: "YouTube"   },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-primary transition-colors flex items-center justify-center"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Tours column */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-white/40 mb-4">
              Tours
            </h4>
            <ul className="space-y-2.5">
              {TOUR_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support column */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-white/40 mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-white/40 mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              {COMPANY_EMAIL && (
                <li>
                  <a
                    href={`mailto:${COMPANY_EMAIL}`}
                    className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Mail className="size-4 shrink-0 text-accent" />
                    {COMPANY_EMAIL}
                  </a>
                </li>
              )}
              {COMPANY_PHONE && (
                <li>
                  <a
                    href={`tel:${COMPANY_PHONE}`}
                    className="flex items-center gap-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <Phone className="size-4 shrink-0 text-accent" />
                    {COMPANY_PHONE}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3 text-sm text-white/60">
                <MapPin className="size-4 shrink-0 text-accent mt-0.5" />
                <span>Tokyo, Japan<br />Available worldwide</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/30 text-sm">
            © {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Crafted with care in Tokyo 🗼
          </p>
        </div>
      </div>
    </footer>
  );
}
