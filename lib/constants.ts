// Static product data shared by client + server.

export const APP_NAME = "Cherrymate";
export const APP_TAGLINE = "Find someone you can comfortably live with.";
export const THEME_COLOR_LIGHT = "#F6F3FA"; // frosted lavender
export const THEME_COLOR_DARK = "#07050B"; // near-black violet

export type Locality = { name: string; lat: number; lng: number };
export type City = { id: string; name: string; center: [number, number]; localities: Locality[] };

export const CITIES: City[] = [
  {
    id: "bangalore",
    name: "Bangalore",
    center: [77.5946, 12.9716],
    localities: [
      { name: "Koramangala", lat: 12.9352, lng: 77.6245 },
      { name: "HSR Layout", lat: 12.9116, lng: 77.6474 },
      { name: "Indiranagar", lat: 12.9784, lng: 77.6408 },
      { name: "Whitefield", lat: 12.9698, lng: 77.75 },
      { name: "Marathahalli", lat: 12.9591, lng: 77.6974 },
      { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
      { name: "Bellandur", lat: 12.9257, lng: 77.6649 },
      { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
      { name: "Jayanagar", lat: 12.925, lng: 77.5938 },
      { name: "JP Nagar", lat: 12.9063, lng: 77.5857 },
      { name: "Hebbal", lat: 13.0358, lng: 77.597 },
      { name: "Malleshwaram", lat: 13.0035, lng: 77.571 },
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    center: [78.4867, 17.385],
    localities: [
      { name: "Gachibowli", lat: 17.4401, lng: 78.3489 },
      { name: "HITEC City", lat: 17.4435, lng: 78.3772 },
      { name: "Madhapur", lat: 17.4483, lng: 78.3915 },
      { name: "Kondapur", lat: 17.4698, lng: 78.3578 },
      { name: "Banjara Hills", lat: 17.4126, lng: 78.4482 },
      { name: "Jubilee Hills", lat: 17.4325, lng: 78.4071 },
      { name: "Kukatpally", lat: 17.4948, lng: 78.3996 },
      { name: "Begumpet", lat: 17.4447, lng: 78.4664 },
      { name: "Ameerpet", lat: 17.4375, lng: 78.4482 },
      { name: "Manikonda", lat: 17.405, lng: 78.3866 },
    ],
  },
  {
    id: "pune",
    name: "Pune",
    center: [73.8567, 18.5204],
    localities: [
      { name: "Koregaon Park", lat: 18.5362, lng: 73.894 },
      { name: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
      { name: "Hinjewadi", lat: 18.5913, lng: 73.7389 },
      { name: "Baner", lat: 18.559, lng: 73.7868 },
      { name: "Kothrud", lat: 18.5074, lng: 73.8077 },
      { name: "Wakad", lat: 18.5975, lng: 73.7707 },
      { name: "Kharadi", lat: 18.5515, lng: 73.9348 },
      { name: "Aundh", lat: 18.558, lng: 73.8075 },
      { name: "Hadapsar", lat: 18.5089, lng: 73.926 },
      { name: "Magarpatta", lat: 18.5146, lng: 73.93 },
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    center: [72.8777, 19.076],
    localities: [
      { name: "Andheri West", lat: 19.1364, lng: 72.8296 },
      { name: "Andheri East", lat: 19.1136, lng: 72.8697 },
      { name: "Bandra West", lat: 19.0596, lng: 72.8295 },
      { name: "Powai", lat: 19.1176, lng: 72.906 },
      { name: "Lower Parel", lat: 18.9986, lng: 72.8302 },
      { name: "Goregaon", lat: 19.1663, lng: 72.8526 },
      { name: "Malad", lat: 19.1874, lng: 72.8484 },
      { name: "Thane West", lat: 19.2183, lng: 72.9781 },
      { name: "Chembur", lat: 19.0522, lng: 72.9005 },
      { name: "Vashi", lat: 19.0771, lng: 72.9986 },
    ],
  },
  {
    id: "delhi-ncr",
    name: "Delhi NCR",
    center: [77.209, 28.6139],
    localities: [
      { name: "Gurgaon Cyber City", lat: 28.495, lng: 77.0895 },
      { name: "Gurgaon Sector 56", lat: 28.4229, lng: 77.107 },
      { name: "Noida Sector 62", lat: 28.627, lng: 77.3727 },
      { name: "Noida Sector 18", lat: 28.5708, lng: 77.3261 },
      { name: "Hauz Khas", lat: 28.5494, lng: 77.2001 },
      { name: "Saket", lat: 28.5245, lng: 77.2066 },
      { name: "Lajpat Nagar", lat: 28.5677, lng: 77.2433 },
      { name: "Malviya Nagar", lat: 28.5355, lng: 77.212 },
      { name: "Dwarka", lat: 28.5921, lng: 77.046 },
      { name: "Laxmi Nagar", lat: 28.6304, lng: 77.2773 },
      { name: "Rajouri Garden", lat: 28.6492, lng: 77.1223 },
    ],
  },
  {
    id: "chennai",
    name: "Chennai",
    center: [80.2707, 13.0827],
    localities: [
      { name: "Sholinganallur (OMR)", lat: 12.901, lng: 80.2279 },
      { name: "Velachery", lat: 12.9815, lng: 80.218 },
      { name: "Adyar", lat: 13.0012, lng: 80.2565 },
      { name: "T. Nagar", lat: 13.0418, lng: 80.2341 },
      { name: "Anna Nagar", lat: 13.085, lng: 80.2101 },
      { name: "Nungambakkam", lat: 13.0569, lng: 80.2425 },
      { name: "Guindy", lat: 13.0067, lng: 80.2206 },
      { name: "Porur", lat: 13.0382, lng: 80.1565 },
      { name: "Perungudi", lat: 12.9654, lng: 80.2461 },
    ],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    center: [88.3639, 22.5726],
    localities: [
      { name: "Salt Lake", lat: 22.5867, lng: 88.4171 },
      { name: "New Town", lat: 22.5807, lng: 88.4612 },
      { name: "Park Street", lat: 22.5539, lng: 88.352 },
      { name: "Ballygunge", lat: 22.5276, lng: 88.3657 },
      { name: "Gariahat", lat: 22.519, lng: 88.366 },
      { name: "Behala", lat: 22.4986, lng: 88.3109 },
      { name: "Dum Dum", lat: 22.642, lng: 88.4312 },
      { name: "Tollygunge", lat: 22.4986, lng: 88.346 },
    ],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    center: [72.5714, 23.0225],
    localities: [
      { name: "Navrangpura", lat: 23.0365, lng: 72.5611 },
      { name: "Satellite", lat: 23.03, lng: 72.5176 },
      { name: "Bodakdev", lat: 23.0398, lng: 72.507 },
      { name: "Vastrapur", lat: 23.0391, lng: 72.529 },
      { name: "Prahlad Nagar", lat: 23.012, lng: 72.5108 },
      { name: "Thaltej (SG Highway)", lat: 23.0504, lng: 72.5 },
      { name: "Maninagar", lat: 22.9962, lng: 72.603 },
      { name: "Chandkheda", lat: 23.109, lng: 72.585 },
    ],
  },
];

export const CITY_IDS = CITIES.map((c) => c.id) as [string, ...string[]];
export const getCity = (id?: string | null) => CITIES.find((c) => c.id === id);
export const getLocality = (cityId: string, name: string) => getCity(cityId)?.localities.find((l) => l.name === name);

export const GENDERS = [
  { value: "female", label: "Woman" },
  { value: "male", label: "Man" },
  { value: "non_binary", label: "Non-binary" },
] as const;

export const OCCUPATIONS = [
  { value: "student", label: "Student" },
  { value: "professional", label: "Working professional" },
] as const;

export const LANGUAGES = [
  "English", "Hindi", "Kannada", "Telugu", "Tamil", "Marathi", "Bengali", "Gujarati",
  "Malayalam", "Punjabi", "Odia", "Urdu",
] as const;

export const LOOKING_TYPES = [
  { value: "has_flat", label: "I have a flat, need a roommate", short: "Has a flat" },
  { value: "needs_flat", label: "Looking for a flat + roommate", short: "Needs a flat" },
] as const;

export const ROOM_TYPES = [
  { value: "private", label: "Private room" },
  { value: "shared", label: "Shared room" },
] as const;

export const FURNISHING = [
  { value: "unfurnished", label: "Unfurnished" },
  { value: "semi", label: "Semi-furnished" },
  { value: "fully", label: "Fully furnished" },
] as const;

/* ---------------------------- Lifestyle ---------------------------- */
// `ordinal` questions are scored by distance between option indexes.
export type LifestyleQuestion = {
  key: string;
  label: string;
  emoji: string;
  optional?: boolean;
  ordinal: boolean;
  weight: number;
  options: { value: string; label: string }[];
};

export const LIFESTYLE: LifestyleQuestion[] = [
  {
    key: "cleanliness", label: "How tidy are you?", emoji: "🧽", ordinal: true, weight: 3,
    options: [
      { value: "spotless", label: "Spotless" },
      { value: "tidy", label: "Tidy" },
      { value: "relaxed", label: "Relaxed" },
      { value: "messy", label: "Messy, honestly" },
    ],
  },
  {
    key: "sleep", label: "Sleep schedule", emoji: "🌙", ordinal: false, weight: 2.5,
    options: [
      { value: "early_bird", label: "Early bird" },
      { value: "flexible", label: "Flexible" },
      { value: "night_owl", label: "Night owl" },
    ],
  },
  {
    key: "food", label: "Food habits", emoji: "🍛", ordinal: false, weight: 3,
    options: [
      { value: "veg", label: "Veg" },
      { value: "non_veg", label: "Non-veg" },
      { value: "eggetarian", label: "Eggetarian" },
      { value: "vegan", label: "Vegan" },
      { value: "jain", label: "Jain" },
    ],
  },
  {
    key: "cooking", label: "How often do you cook?", emoji: "🍳", ordinal: true, weight: 1,
    options: [
      { value: "daily", label: "Daily" },
      { value: "often", label: "Few times a week" },
      { value: "rarely", label: "Rarely" },
      { value: "never", label: "Never" },
    ],
  },
  {
    key: "smoking", label: "Smoking", emoji: "🚭", ordinal: true, weight: 3,
    options: [
      { value: "never", label: "Never" },
      { value: "outside", label: "Only outside" },
      { value: "occasionally", label: "Occasionally" },
      { value: "regularly", label: "Regularly" },
    ],
  },
  {
    key: "drinking", label: "Drinking", emoji: "🍷", ordinal: true, weight: 1.5,
    options: [
      { value: "never", label: "Never" },
      { value: "socially", label: "Socially" },
      { value: "regularly", label: "Regularly" },
    ],
  },
  {
    key: "guests", label: "Guests & parties", emoji: "🎉", ordinal: true, weight: 1.5,
    options: [
      { value: "rarely", label: "Rarely" },
      { value: "sometimes", label: "Sometimes" },
      { value: "often", label: "Love hosting" },
    ],
  },
  {
    key: "pets", label: "Pets", emoji: "🐾", ordinal: false, weight: 1.5,
    options: [
      { value: "have_pets", label: "I have pets" },
      { value: "love_pets", label: "Love them" },
      { value: "no_pets", label: "Prefer none" },
      { value: "allergic", label: "Allergic" },
    ],
  },
  {
    key: "wfh", label: "Work from home", emoji: "💻", ordinal: true, weight: 0.75,
    options: [
      { value: "never", label: "Never" },
      { value: "hybrid", label: "Hybrid" },
      { value: "always", label: "Always" },
    ],
  },
  {
    key: "noise", label: "Noise tolerance", emoji: "🔊", ordinal: true, weight: 1.5,
    options: [
      { value: "quiet", label: "Need quiet" },
      { value: "moderate", label: "Moderate" },
      { value: "lively", label: "Lively is fine" },
    ],
  },
  {
    key: "social", label: "Social style", emoji: "🫶", ordinal: true, weight: 1,
    options: [
      { value: "introvert", label: "Introvert" },
      { value: "ambivert", label: "Ambivert" },
      { value: "extrovert", label: "Extrovert" },
    ],
  },
  {
    key: "religion", label: "Religious / cultural practices", emoji: "🪔", optional: true, ordinal: true, weight: 0.75,
    options: [
      { value: "not_important", label: "Not important" },
      { value: "somewhat", label: "Somewhat" },
      { value: "very", label: "Very important" },
    ],
  },
];

export const LIFESTYLE_KEYS = LIFESTYLE.map((q) => q.key);
export const lifestyleLabel = (key: string, value?: string) =>
  LIFESTYLE.find((q) => q.key === key)?.options.find((o) => o.value === value)?.label;

/* --------------------------- Dealbreakers -------------------------- */
// `violates(lifestyle)` → true if a person with this lifestyle breaks the dealbreaker.
// Mongo equivalents live in lib/matching.ts so filtering happens in the database.
export const DEALBREAKERS = [
  { value: "no_smokers", label: "No smokers" },
  { value: "no_drinkers", label: "No drinkers" },
  { value: "veg_only", label: "Veg only" },
  { value: "no_pets", label: "No pets" },
  { value: "no_parties", label: "No parties" },
  { value: "no_night_owls", label: "No night owls" },
  { value: "tidy_only", label: "Tidy people only" },
] as const;

export type DealbreakerValue = (typeof DEALBREAKERS)[number]["value"];

/* ------------------------------ Safety ----------------------------- */
export const REPORT_REASONS = [
  { value: "fake_profile", label: "Fake profile" },
  { value: "harassment", label: "Harassment" },
  { value: "scam", label: "Scam / asking for money" },
  { value: "inappropriate_photos", label: "Inappropriate photos" },
  { value: "other", label: "Other" },
] as const;

export const SAFETY_BANNER =
  "Never pay a deposit before visiting the flat in person. Meet in public first.";

/* ------------------------------- Map ------------------------------- */
export const RADIUS_OPTIONS = [
  { km: 1, label: "Walkable" },
  { km: 3, label: "Nearby" },
  { km: 5, label: "Area" },
  { km: 10, label: "City" },
] as const;

export const LIMITS = {
  likesPerDay: 100,
  messagesPerMinute: 30,
  mapQueriesPerMinute: 30,
  locationUpdateHours: 6,
  bioMax: 300,
  maxPhotos: 4,
  maxFlatPhotos: 6,
} as const;
