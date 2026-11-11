/**
 * Seeds ~30 realistic fake profiles across Bangalore, Hyderabad and Pune.
 *
 *   npm run seed
 *   SEED_LIKE_EMAIL=you@gmail.com npm run seed   # seeded people in your city will already have liked you
 *
 * Re-running is safe: previous seed users (…@seed.cherrymate.test) and their data are removed first.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import mongoose from "mongoose";
import { withSrvDnsFallback } from "../lib/mongo-dns";
import { User, Swipe, Match, Message, pairKeyOf } from "../models";
import { CITIES } from "../lib/constants";
import { fuzzLocation, newJitter } from "../lib/geo";

const DOMAIN = "seed.cherrymate.test";

// Deterministic PRNG so the seed is reproducible
let seed = 42;
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];
const some = <T,>(arr: readonly T[], n: number) => [...arr].sort(() => rand() - 0.5).slice(0, n);
const between = (a: number, b: number) => Math.round(a + rand() * (b - a));

type P = { name: string; gender: "female" | "male"; org: string; occ: "student" | "professional"; langs: string[]; bio: string };

const PEOPLE: Record<string, P[]> = {
  bangalore: [
    { name: "Ananya Rao", gender: "female", org: "Flipkart", occ: "professional", langs: ["English", "Kannada", "Hindi"], bio: "Product designer. Weekend treks to Nandi Hills, early mornings, filter coffee snob." },
    { name: "Rohan Mehta", gender: "male", org: "Razorpay", occ: "professional", langs: ["English", "Hindi", "Gujarati"], bio: "Backend dev, gym at 7, cooks a mean rajma. Looking for a chill, tidy flatmate." },
    { name: "Priya Nair", gender: "female", org: "Christ University", occ: "student", langs: ["English", "Malayalam"], bio: "MBA student. Plants, podcasts and pasta. Quiet on weekdays, fun on weekends." },
    { name: "Arjun Reddy", gender: "male", org: "Infosys", occ: "professional", langs: ["English", "Telugu", "Kannada"], bio: "Cricket every Sunday. Neat, easy-going, hates loud music after 11." },
    { name: "Sneha Iyer", gender: "female", org: "Swiggy", occ: "professional", langs: ["English", "Tamil"], bio: "Data analyst, Carnatic music, strictly veg kitchen please!" },
    { name: "Karthik S", gender: "male", org: "IISc", occ: "student", langs: ["English", "Tamil", "Kannada"], bio: "PhD in physics. Night owl, reads a lot, makes great filter coffee." },
    { name: "Meera Joshi", gender: "female", org: "Zerodha", occ: "professional", langs: ["English", "Marathi", "Hindi"], bio: "Runner, baker, cat mom (one very polite cat)." },
    { name: "Vikram Singh", gender: "male", org: "Ola", occ: "professional", langs: ["English", "Hindi", "Punjabi"], bio: "Loves hosting dinners. Clean kitchen, loud laugh." },
    { name: "Divya Krishnan", gender: "female", org: "Accenture", occ: "professional", langs: ["English", "Tamil", "Kannada"], bio: "Hybrid worker, yoga in the mornings, Netflix at night." },
    { name: "Aditya Kulkarni", gender: "male", org: "PES University", occ: "student", langs: ["English", "Kannada", "Marathi"], bio: "Final-year CS, hackathons, guitar (quietly, promise)." },
    { name: "Nisha Patel", gender: "female", org: "Myntra", occ: "professional", langs: ["English", "Gujarati", "Hindi"], bio: "Fashion merch. Jain food, tidy, loves board game nights." },
    { name: "Sameer Khan", gender: "male", org: "Microsoft", occ: "professional", langs: ["English", "Urdu", "Hindi"], bio: "WFH most days. Biryani enthusiast. Looking for a respectful, clean flatmate." },
  ],
  hyderabad: [
    { name: "Lakshmi Prasad", gender: "female", org: "Deloitte", occ: "professional", langs: ["English", "Telugu"], bio: "Consultant, travel often, need a reliable flatmate who keeps things calm." },
    { name: "Rahul Varma", gender: "male", org: "Amazon", occ: "professional", langs: ["English", "Telugu", "Hindi"], bio: "SDE at HITEC City. Badminton, biryani and a strict 'dishes same day' rule." },
    { name: "Fatima Sheikh", gender: "female", org: "University of Hyderabad", occ: "student", langs: ["English", "Urdu", "Hindi"], bio: "Masters in linguistics. Early bird, chai lover, quiet home please." },
    { name: "Sai Teja", gender: "male", org: "TCS", occ: "professional", langs: ["English", "Telugu"], bio: "New to the city! Easy-going, love cooking Andhra food." },
    { name: "Pooja Agarwal", gender: "female", org: "Google", occ: "professional", langs: ["English", "Hindi"], bio: "UX researcher. Plants, pottery, pets welcome." },
    { name: "Nikhil Rao", gender: "male", org: "ISB", occ: "student", langs: ["English", "Telugu", "Kannada"], bio: "PGP student, busy schedule, keeps to himself mostly." },
    { name: "Harini Reddy", gender: "female", org: "Novartis", occ: "professional", langs: ["English", "Telugu", "Tamil"], bio: "Pharma research. Clean freak (in a good way)." },
    { name: "Imran Ali", gender: "male", org: "Deloitte", occ: "professional", langs: ["English", "Urdu", "Telugu"], bio: "Football on weekends, chill at home, likes a tidy space." },
    { name: "Keerthi M", gender: "female", org: "Infosys", occ: "professional", langs: ["English", "Telugu"], bio: "Night shifts sometimes, so I appreciate a quiet daytime." },
  ],
  pune: [
    { name: "Aarti Deshpande", gender: "female", org: "Symbiosis", occ: "student", langs: ["English", "Marathi", "Hindi"], bio: "Law student. Early riser, chai, books, and a very clean room." },
    { name: "Siddharth Patil", gender: "male", org: "Persistent", occ: "professional", langs: ["English", "Marathi"], bio: "Developer, cyclist, weekend Sinhagad treks." },
    { name: "Riya Sharma", gender: "female", org: "Barclays", occ: "professional", langs: ["English", "Hindi", "Punjabi"], bio: "Analyst at Kharadi. Love cooking, hate clutter." },
    { name: "Omkar Joshi", gender: "male", org: "COEP", occ: "student", langs: ["English", "Marathi"], bio: "Mech engineering student, gym rat, makes protein shakes at 6am." },
    { name: "Tanvi Kulkarni", gender: "female", org: "Infosys", occ: "professional", langs: ["English", "Marathi", "Kannada"], bio: "Hinjewadi commuter, so I'd love someone nearby. Veg household." },
    { name: "Yash Agarwal", gender: "male", org: "Mastercard", occ: "professional", langs: ["English", "Hindi"], bio: "Music, movies, occasional house parties (with notice!)." },
    { name: "Shruti Bhat", gender: "female", org: "FLAME University", occ: "student", langs: ["English", "Kannada", "Hindi"], bio: "Psych student, introvert, loves dogs." },
    { name: "Kunal Shah", gender: "male", org: "Tata Motors", occ: "professional", langs: ["English", "Gujarati", "Marathi"], bio: "Engineer, cooks Gujarati food on Sundays, very organised." },
    { name: "Ishita Ghosh", gender: "female", org: "Amdocs", occ: "professional", langs: ["English", "Bengali", "Hindi"], bio: "Fish curry & Rabindrasangeet. Looking for a warm, respectful roomie." },
  ],
};

const L = {
  cleanliness: ["spotless", "tidy", "tidy", "relaxed", "messy"],
  sleep: ["early_bird", "flexible", "night_owl"],
  food: ["veg", "veg", "non_veg", "non_veg", "eggetarian", "vegan", "jain"],
  cooking: ["daily", "often", "rarely", "never"],
  smoking: ["never", "never", "never", "outside", "occasionally"],
  drinking: ["never", "socially", "socially", "regularly"],
  guests: ["rarely", "sometimes", "often"],
  pets: ["have_pets", "love_pets", "no_pets", "allergic"],
  wfh: ["never", "hybrid", "always"],
  noise: ["quiet", "moderate", "lively"],
  social: ["introvert", "ambivert", "extrovert"],
  religion: ["not_important", "somewhat", "very"],
} as const;

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in .env.local first");
  await withSrvDnsFallback(() => mongoose.connect(uri));
  console.log("Connected. Cleaning old seed data…");

  const old = await User.find({ email: new RegExp(`@${DOMAIN.replace(/\./g, "\\.")}$`) }, { _id: 1 }).lean();
  const oldIds = old.map((u) => u._id);
  const oldMatches = await Match.find({ users: { $in: oldIds } }, { _id: 1 }).lean();
  await Promise.all([
    Message.deleteMany({ matchId: { $in: oldMatches.map((m) => m._id) } }),
    Match.deleteMany({ _id: { $in: oldMatches.map((m) => m._id) } }),
    Swipe.deleteMany({ $or: [{ fromUser: { $in: oldIds } }, { toUser: { $in: oldIds } }] }),
    User.deleteMany({ _id: { $in: oldIds } }),
  ]);
  await User.createIndexes();

  const created: { _id: mongoose.Types.ObjectId; city: string; gender: string; name: string }[] = [];
  let w = 1;
  let m = 1;

  for (const [cityId, people] of Object.entries(PEOPLE)) {
    const city = CITIES.find((c) => c.id === cityId)!;
    for (const p of people) {
      const hasFlat = rand() < 0.4;
      const loc = pick(city.localities);
      const prefs = some(city.localities, between(2, 4)).map((l) => l.name);
      if (!prefs.includes(loc.name)) prefs[0] = loc.name;
      const budgetMin = pick([6000, 8000, 10000, 12000, 15000]);
      const budgetMax = budgetMin + pick([4000, 6000, 8000, 10000]);
      const age = between(19, 32);
      const showOnMap = rand() < 0.75;
      const portrait = p.gender === "female" ? `women/${(w++ * 7) % 99}` : `men/${(m++ * 7) % 99}`;
      const jitter = newJitter();
      // Spread people around their locality, then fuzz exactly like real users
      const f = fuzzLocation(loc.lat + (rand() - 0.5) * 0.02, loc.lng + (rand() - 0.5) * 0.02, jitter);
      const lifestyle = Object.fromEntries(Object.entries(L).map(([k, opts]) => [k, pick(opts)]));
      if (rand() < 0.3) delete (lifestyle as Record<string, string>).religion;

      const u = await User.create({
        name: p.name,
        email: `${p.name.toLowerCase().replace(/[^a-z]+/g, ".")}@${DOMAIN}`,
        image: `https://randomuser.me/api/portraits/${portrait}.jpg`,
        age,
        gender: p.gender,
        photos: [
          { url: `https://randomuser.me/api/portraits/${portrait}.jpg` },
          { url: `https://randomuser.me/api/portraits/${p.gender === "female" ? "women" : "men"}/${(Number(portrait.split("/")[1]) + 13) % 99}.jpg` },
        ],
        occupation: p.occ,
        organisation: p.org,
        bio: p.bio,
        languages: p.langs,
        lookingType: hasFlat ? "has_flat" : "needs_flat",
        city: cityId,
        localities: prefs,
        budgetMin,
        budgetMax,
        moveInDate: new Date(Date.now() + between(3, 60) * 864e5),
        roomType: rand() < 0.8 ? "private" : "shared",
        flat: hasFlat
          ? { rent: pick([9000, 11000, 12500, 14000, 16000, 18000, 22000]), deposit: pick([20000, 30000, 50000]), furnishing: pick(["semi", "fully", "unfurnished"]), locality: loc.name, photos: [] }
          : undefined,
        lifestyle,
        preferences: {
          roommateGender: rand() < 0.55 ? "same" : "any",
          ageMin: 18,
          ageMax: between(30, 40),
          dealbreakers: rand() < 0.35 ? some(["no_smokers", "veg_only", "no_pets", "no_parties"], 1) : [],
        },
        onboardingComplete: true,
        onboardingStep: 5,
        isVerified: rand() < 0.3,
        lastActive: new Date(Date.now() - between(0, 72) * 3600e3),
        showOnMap,
        mapVisibleToWomenOnly: p.gender === "female" && showOnMap && rand() < 0.25,
        location: { type: "Point", coordinates: [f.lng, f.lat] },
        locationSource: "manual",
        locationLocality: loc.name,
        locationUpdatedAt: new Date(),
        locationJitter: jitter,
      });
      created.push({ _id: u._id, city: cityId, gender: p.gender, name: p.name });
    }
  }
  console.log(`✓ Created ${created.length} profiles`);

  // Some likes between seed users + a few matches with a conversation
  let likes = 0;
  for (const a of created) {
    for (const b of some(created.filter((x) => x.city === a.city && x._id !== a._id), 3)) {
      await Swipe.updateOne({ fromUser: a._id, toUser: b._id }, { $set: { direction: "like", source: "discover" } }, { upsert: true });
      likes++;
    }
  }
  const pairs = [
    [created[0], created[1]],
    [created[12], created[13]],
    [created[21], created[22]],
  ];
  for (const [a, b] of pairs) {
    await Swipe.updateOne({ fromUser: a._id, toUser: b._id }, { $set: { direction: "like" } }, { upsert: true });
    await Swipe.updateOne({ fromUser: b._id, toUser: a._id }, { $set: { direction: "like" } }, { upsert: true });
    const match = await Match.create({ users: [a._id, b._id], pairKey: pairKeyOf(String(a._id), String(b._id)) });
    const msgs = [
      [a, "Hey! Saw we both like a tidy place 😄 Is the room still available?"],
      [b, "Hi! Yes it is. Rent is split equally, maintenance ~₹1.5k. Want to visit this weekend?"],
      [a, "Sounds good — Saturday 11am? We could grab a coffee nearby first."],
    ] as const;
    let t = Date.now() - 3600e3;
    for (const [s, text] of msgs) {
      const msg = await Message.create({ matchId: match._id, sender: s._id, text, clientId: `seed-${match._id}-${t}`, readAt: new Date() });
      await Message.updateOne({ _id: msg._id }, { $set: { createdAt: new Date((t += 300e3)) } });
    }
    await Match.updateOne({ _id: match._id }, { $set: { lastMessageAt: new Date(t), lastMessage: { text: msgs[2][1], sender: a._id } } });
  }
  console.log(`✓ ${likes} likes and ${pairs.length} matches with messages`);

  // Make seeded people like YOU, so liking them back creates an instant match
  const email = process.env.SEED_LIKE_EMAIL;
  if (email) {
    const me = await User.findOne({ email }).lean();
    if (!me) console.warn(`! No user with email ${email} — sign in once first, then re-run.`);
    else {
      const fans = created.filter((c) => !me.city || c.city === me.city).slice(0, 8);
      for (const f of fans) await Swipe.updateOne({ fromUser: f._id, toUser: me._id }, { $set: { direction: "like", source: "discover" } }, { upsert: true });
      console.log(`✓ ${fans.length} seeded people now like ${email} — like them back to match`);
    }
  }

  await mongoose.disconnect();
  console.log("Done 🍒");
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
