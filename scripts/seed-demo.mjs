/**
 * seed-demo.mjs
 * Creates demo destinations (4 cities, 5-6 places each),
 * 3 tours per location (~60-72 tours), and 30 days of availability.
 *
 * Usage:  node scripts/seed-demo.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── DESTINATIONS ───────────────────────────────────────────
const DESTINATIONS = [
  {
    name: "Tokyo Region",
    slug: "tokyo-region",
    order: 1,
    places: [
      { name: "Shibuya",     subtitle: "Famous crossing & nightlife",     linkQuery: "Shibuya"     },
      { name: "Shinjuku",    subtitle: "Skyscrapers & entertainment",     linkQuery: "Shinjuku"    },
      { name: "Asakusa",     subtitle: "Senso-ji Temple & traditions",    linkQuery: "Asakusa"     },
      { name: "Akihabara",   subtitle: "Anime, gaming & electronics",    linkQuery: "Akihabara"   },
      { name: "Harajuku",    subtitle: "Fashion, culture & Meiji Shrine", linkQuery: "Harajuku"    },
      { name: "Odaiba",      subtitle: "Futuristic island & teamLab",    linkQuery: "Odaiba"      },
    ],
  },
  {
    name: "Kyoto Region",
    slug: "kyoto-region",
    order: 2,
    places: [
      { name: "Fushimi Inari",    subtitle: "10,000 vermillion torii gates", linkQuery: "Fushimi Inari" },
      { name: "Arashiyama",       subtitle: "Bamboo grove & monkey park",    linkQuery: "Arashiyama"    },
      { name: "Gion",             subtitle: "Geisha district & tea houses",  linkQuery: "Gion"          },
      { name: "Kinkaku-ji",       subtitle: "Golden Pavilion & gardens",     linkQuery: "Kinkaku-ji"    },
      { name: "Higashiyama",      subtitle: "Historic lanes & temples",      linkQuery: "Higashiyama"   },
    ],
  },
  {
    name: "Osaka Region",
    slug: "osaka-region",
    order: 3,
    places: [
      { name: "Dotonbori",       subtitle: "Street food & neon paradise",   linkQuery: "Dotonbori"    },
      { name: "Osaka Castle",    subtitle: "Iconic castle & park",          linkQuery: "Osaka Castle" },
      { name: "Shinsekai",       subtitle: "Retro vibes & kushikatsu",      linkQuery: "Shinsekai"    },
      { name: "Namba",           subtitle: "Shopping, comedy & nightlife",  linkQuery: "Namba"        },
      { name: "Umeda",           subtitle: "Sky building & skyline views",  linkQuery: "Umeda"        },
      { name: "Kuromon Market",  subtitle: "Osaka's kitchen — seafood galore", linkQuery: "Kuromon"   },
    ],
  },
  {
    name: "Hiroshima Region",
    slug: "hiroshima-region",
    order: 4,
    places: [
      { name: "Peace Memorial Park",  subtitle: "World heritage peace site",   linkQuery: "Peace Park"      },
      { name: "Miyajima Island",       subtitle: "Floating torii gate",         linkQuery: "Miyajima"        },
      { name: "Shukkeien Garden",      subtitle: "Historic Japanese garden",    linkQuery: "Shukkeien"       },
      { name: "Onomichi",              subtitle: "Coastal town & temple walk",  linkQuery: "Onomichi"        },
      { name: "Rabbit Island",         subtitle: "Ōkunoshima — wild rabbits",   linkQuery: "Rabbit Island"   },
    ],
  },
];

// ─── TOURS (3 per location) ─────────────────────────────────
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tourTemplates(placeName, destName) {
  const city = destName.replace(" Region", "");
  return [
    {
      title: `${placeName} Walking Tour — Hidden Gems & Local Stories`,
      shortDescription: `Discover the hidden side of ${placeName} with a local guide. Walk through backstreets, visit secret shrines, and learn fascinating local legends.`,
      description: `<h2>Explore ${placeName} Like a Local</h2><p>Join our expert local guide for an unforgettable walking tour through ${placeName}. This isn't your typical tourist trail — we'll take you deep into the neighbourhood's most charming backstreets, hidden temples, and local favourites.</p><h3>What makes this special?</h3><p>Our guides are born and raised in ${city}. They know every hidden alley, every secret garden, and every local legend. You'll see a side of ${placeName} that most visitors never discover.</p><p>The tour includes stops at local artisan shops, a traditional drink at a neighbourhood izakaya, and plenty of photo opportunities at spots you won't find in any guidebook.</p>`,
      category: "CULTURAL",
      duration: 3,
      durationType: "hours",
      difficulty: "EASY",
      basePrice: 65,
      maxGroupSize: 12,
      highlights: ["Local guide born in the area", "Hidden shrines & backstreets", "Traditional snack included", "Small group (max 12)", "Photo-worthy secret spots"],
      includes: ["Professional English-speaking guide", "Traditional snack & drink", "Walking map of the area"],
      excludes: ["Hotel pickup", "Lunch", "Public transport fares"],
    },
    {
      title: `${placeName} Food Tour — Taste of ${city}`,
      shortDescription: `Eat your way through ${placeName}! Sample 8-10 authentic dishes, visit local markets, and discover ${city}'s best-kept culinary secrets.`,
      description: `<h2>A Culinary Journey Through ${placeName}</h2><p>Get ready to eat like a local! This food-focused walking tour takes you through the best eateries, market stalls, and hidden restaurants in ${placeName}.</p><h3>What you'll taste</h3><p>Over 3 delicious hours, you'll sample 8-10 different dishes — from freshly grilled street food to delicate traditional sweets. Every stop has been hand-picked by our food-obsessed guides.</p><p>Learn about the history behind each dish, discover the ingredients that make ${city} cuisine unique, and get insider recommendations for the rest of your trip.</p>`,
      category: "FOOD_AND_DRINK",
      duration: 3,
      durationType: "hours",
      difficulty: "EASY",
      basePrice: 89,
      maxGroupSize: 8,
      highlights: ["8-10 food tastings included", "Local markets & hidden eateries", "Vegetarian options available", "Small group (max 8)", "Food-obsessed local guide"],
      includes: ["All food tastings (8-10 dishes)", "Non-alcoholic drinks", "Expert food guide", "Dietary accommodation"],
      excludes: ["Hotel pickup", "Alcoholic beverages", "Gratuities"],
    },
    {
      title: `${placeName} Photography & Sightseeing Experience`,
      shortDescription: `Capture stunning photos of ${placeName}'s most iconic and secret viewpoints. Perfect for photographers of all levels.`,
      description: `<h2>Photograph ${placeName} at Its Best</h2><p>Whether you're a seasoned photographer or just love taking great photos, this tour will help you capture ${placeName} in a way you never thought possible.</p><h3>Golden hour magic</h3><p>We time our tours to catch the best light. Your guide — a professional photographer — will share composition tips, recommend camera settings, and take you to viewpoints that most tourists walk right past.</p><p>From sweeping cityscapes to intimate detail shots of traditional architecture, you'll finish the tour with a camera roll full of stunning images.</p>`,
      category: "CITY_TOUR",
      duration: 4,
      durationType: "hours",
      difficulty: "MODERATE",
      basePrice: 79,
      maxGroupSize: 10,
      highlights: ["Pro photographer guide", "Golden hour timing", "Secret viewpoints", "Composition tips & tricks", "Suitable for any camera/phone"],
      includes: ["Professional photographer guide", "Viewpoint map", "Digital group photo"],
      excludes: ["Camera equipment", "Hotel pickup", "Food & drinks"],
    },
  ];
}

async function main() {
  console.log("🌸 Starting GoTripJapan demo seed...\n");

  // ── 1. Destinations & Places ──
  console.log("📍 Creating destinations & places...");
  for (const dest of DESTINATIONS) {
    const existing = await prisma.destination.findUnique({ where: { slug: dest.slug } });
    if (existing) {
      console.log(`   ⏩ Skipping "${dest.name}" (already exists)`);
      continue;
    }
    await prisma.destination.create({
      data: {
        name: dest.name,
        slug: dest.slug,
        order: dest.order,
        isActive: true,
        places: {
          create: dest.places.map((p, i) => ({
            name: p.name,
            subtitle: p.subtitle,
            linkQuery: p.linkQuery,
            order: i + 1,
            isActive: true,
          })),
        },
      },
    });
    console.log(`   ✅ ${dest.name} — ${dest.places.length} places`);
  }

  // ── 2. Tours (3 per place) ──
  console.log("\n🗺️  Creating tours...");
  let tourCount = 0;

  for (const dest of DESTINATIONS) {
    for (const place of dest.places) {
      const templates = tourTemplates(place.name, dest.name);

      for (const tmpl of templates) {
        const slug = slugify(tmpl.title);
        const existing = await prisma.tour.findUnique({ where: { slug } });
        if (existing) {
          console.log(`   ⏩ Skipping "${tmpl.title}" (slug exists)`);
          continue;
        }

        const city = dest.name.replace(" Region", "");
        const tour = await prisma.tour.create({
          data: {
            slug,
            title: tmpl.title,
            shortDescription: tmpl.shortDescription,
            description: tmpl.description,
            highlights: tmpl.highlights,
            includes: tmpl.includes,
            excludes: tmpl.excludes,
            importantInfo: [
              "Wear comfortable walking shoes",
              "Tour operates rain or shine",
              "Not wheelchair accessible",
              "Children must be accompanied by an adult",
            ],
            itinerary: [
              { order: 1, title: "Meet your guide", description: `Meet at the designated meeting point in ${place.name}. Your guide will give a brief introduction.`, stayMinutes: "15", isOptional: false },
              { order: 2, title: `Explore ${place.name}`, description: `Walk through the highlights with expert commentary.`, stayMinutes: "90", isOptional: false },
              { order: 3, title: "Hidden spots & local stops", description: "Discover off-the-beaten-path locations that most visitors miss.", stayMinutes: "60", isOptional: false },
              { order: 4, title: "Wrap up & recommendations", description: `Your guide shares personalised tips for the rest of your ${city} trip.`, stayMinutes: "15", isOptional: false },
            ],
            duration: tmpl.duration,
            durationType: tmpl.durationType,
            maxGroupSize: tmpl.maxGroupSize,
            minGroupSize: 1,
            dailyCapacity: tmpl.maxGroupSize * 2,
            meetingPoint: `${place.name} Station, ${city}, Japan`,
            endPoint: `${place.name} Station, ${city}, Japan`,
            location: place.name,
            prefecture: city,
            country: "Japan",
            category: tmpl.category,
            difficulty: tmpl.difficulty,
            languages: ["English", "Japanese"],
            tourType: "GROUP",
            baseGroupSize: 4,
            basePrice: tmpl.basePrice,
            childPrice: Math.round(tmpl.basePrice * 0.6),
            status: "PUBLISHED",
            featured: tmpl.category === "FOOD_AND_DRINK" || (tourCount % 5 === 0),
            likelyToSellOut: tmpl.category === "FOOD_AND_DRINK",
            rating: (4.2 + Math.random() * 0.8).toFixed(2),
            reviewCount: Math.floor(20 + Math.random() * 280),
          },
        });

        // ── 3. Availability (next 30 days) ──
        const availabilities = [];
        const today = new Date();
        for (let d = 1; d <= 30; d++) {
          const date = new Date(today);
          date.setDate(today.getDate() + d);
          // Zero out time
          date.setHours(0, 0, 0, 0);

          availabilities.push({
            tourId: tour.id,
            date,
            startTime: tmpl.category === "CITY_TOUR" ? "15:30" : "09:00",
            maxCapacity: tmpl.maxGroupSize * 2,
            bookedCount: 0,
            status: "AVAILABLE",
          });
        }

        // Insert availability — skip duplicates
        for (const avail of availabilities) {
          try {
            await prisma.tourAvailability.create({ data: avail });
          } catch {
            // unique constraint (tourId + date) — already exists
          }
        }

        tourCount++;
        console.log(`   ✅ [${tourCount}] ${tmpl.title}`);
      }
    }
  }

  console.log(`\n🎉 Seed complete! Created ${tourCount} tours with availability.\n`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
