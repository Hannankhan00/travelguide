import { Search, Star, RefreshCcw } from "lucide-react";

const CARDS = [
  {
    icon:        Search,
    iconBg:      "from-[#185FA5] to-[#0C447C]",
    accentBg:    "bg-[#E6F1FB]",
    accentText:  "text-[#185FA5]",
    badge:       null,
    title:       "Experiences worth traveling for",
    description: "Discover tours led by local Japanese experts — hand-picked from thousands so every hour counts.",
    pill:        null,
  },
  {
    icon:        Star,
    iconBg:      "from-[#EF9F27] to-[#B45309]",
    accentBg:    "bg-[#FDF3E2]",
    accentText:  "text-[#B45309]",
    badge:       "4.9",
    title:       "Book with confidence",
    description: "Verified reviews, detailed itineraries, and instant booking — everything you need to decide.",
    pill:        "Top rated",
  },
  {
    icon:        RefreshCcw,
    iconBg:      "from-[#15803D] to-[#166534]",
    accentBg:    "bg-[#DCFCE7]",
    accentText:  "text-[#15803D]",
    badge:       null,
    title:       "Plans change and that's ok",
    description: "Free cancellation up to 24 hours before most tours, with 24/7 support along the way.",
    pill:        null,
  },
] as const;

export function BookConfidenceSection() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111] mb-10">
          Why book with GoTripJapan?
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {CARDS.map(({ icon: Icon, iconBg, accentBg, accentText, badge, title, description, pill }) => (
            <div
              key={title}
              className="group relative flex flex-col rounded-2xl border border-[#E7E8EE] bg-white hover:shadow-[0_8px_40px_rgba(0,0,0,0.07)] transition-all duration-300 overflow-hidden"
            >
              {/* Icon area */}
              <div className={`relative h-40 sm:h-44 ${accentBg} flex items-center justify-center`}>
                <div className="relative flex items-center justify-center">
                  <div className={`w-20 h-20 rounded-2xl bg-linear-to-br ${iconBg} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className="size-9 text-white" strokeWidth={1.75} />
                  </div>

                  {badge && (
                    <div className="absolute -bottom-3 -right-4 flex items-center gap-1 bg-white rounded-full shadow-md px-2.5 py-1 border border-[#F0EDE8]">
                      <Star className="size-3.5 text-[#EF9F27] fill-[#EF9F27]" />
                      <span className="text-xs font-bold text-[#111]">{badge}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Text content */}
              <div className="flex flex-col flex-1 p-6">
                {pill && (
                  <span className={`self-start text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${accentBg} ${accentText} mb-3`}>
                    {pill}
                  </span>
                )}
                <h3 className="font-display font-bold text-[#111] text-base sm:text-[17px] leading-snug mb-2">
                  {title}
                </h3>
                <p className="text-sm text-[#7A746D] leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
