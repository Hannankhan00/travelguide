import { COMPANY_NAME } from "@/lib/constants";
import { Globe, Heart, ShieldCheck, Award, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "About Us | " + COMPANY_NAME,
  description: "Learn about our mission to provide authentic and unforgettable travel experiences across Japan.",
};

export default function AboutPage() {
  return (
    <div className="bg-[#F8F9FF] min-h-screen pt-24 md:pt-28 pb-20">
      {/* ── Hero ────────────────────────────────────────── */}
      <div className="relative bg-[#0C447C] overflow-hidden py-24">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "24px 24px",
          }}
        />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <p className="text-[#EF9F27] font-bold text-xs sm:text-sm uppercase tracking-widest mb-4">
            Our Story
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-tight mb-6 max-w-3xl mx-auto">
            Discover the Heart & Soul of Japan
          </h1>
          <p className="text-white/80 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            We are a team of passionate locals and seasoned travelers dedicated to curating the most authentic, immersive, and unforgettable experiences across Japan.
          </p>
        </div>
      </div>

      {/* ── Mission Section ─────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#111] leading-tight">
              We believe travel is about <span className="text-[#185FA5]">connection</span>.
            </h2>
            <p className="text-[#545454] text-lg leading-relaxed">
              At {COMPANY_NAME}, we go beyond the typical tourist trails. Our mission is to bridge the gap between curious travelers and rich Japanese culture. 
            </p>
            <p className="text-[#545454] text-lg leading-relaxed">
              Whether you are tasting street food through the bustling alleys of Osaka, discovering serene hidden temples in Kyoto, or photographing the neon glow of Tokyo, we ensure every moment is crafted with care and deep local knowledge.
            </p>
          </div>
          
          <div className="relative h-100 w-full rounded-3xl overflow-hidden shadow-xl border-4 border-white">
            <div className="absolute inset-0 bg-[#0C447C]/10 z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1528360983277-13d401cdc186?q=80&w=2070&auto=format&fit=crop"
              alt="Japanese Torii Gate in water"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* ── Our Values ──────────────────────────────────── */}
      <div className="bg-white py-24 border-y border-[#E7E8EE]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-[#111] mb-4">Our Core Values</h2>
            <p className="text-[#7A746D] md:text-lg">What sets us apart and drives everything we do.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Authenticity",
                desc: "We partner with local guides who know the true culture, history, and hidden gems of their cities.",
                icon: Globe,
              },
              {
                title: "Quality Over Quantity",
                desc: "Every tour is handpicked, vetted, and continuously improved based on honest traveler feedback.",
                icon: Award,
              },
              {
                title: "Trust & Safety",
                desc: "Your comfort is our priority. We provide clear itineraries, secure bookings, and reliable support.",
                icon: ShieldCheck,
              },
              {
                title: "Passionate Service",
                desc: "We pour our love for Japan into every detail, ensuring you have the trip of a lifetime.",
                icon: Heart,
              },
            ].map((value, i) => (
              <div key={i} className="bg-[#F8F9FF] rounded-2xl p-8 border border-[#E7E8EE] hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-[#E7E8EE] flex items-center justify-center mb-6">
                  <value.icon className="size-6 text-[#EF9F27]" />
                </div>
                <h3 className="text-xl font-bold font-display text-[#0C447C] mb-3">{value.title}</h3>
                <p className="text-[#545454] leading-relaxed text-sm">
                  {value.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-[#111] mb-6">
          Ready to start your journey?
        </h2>
        <p className="text-lg text-[#7A746D] mb-10 max-w-xl mx-auto">
          Browse our carefully curated selection of tours and find the perfect experience for your trip to Japan.
        </p>
        <Link 
          href="/tours" 
          className="inline-flex items-center gap-2 bg-[#185FA5] hover:bg-[#12487F] text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-colors text-lg"
        >
          Explore All Tours <ArrowRight className="size-5" />
        </Link>
      </div>

    </div>
  );
}
