// Shapes that cross the server → client boundary. Never include email, exact location or phone.

export type Photo = { url: string; publicId?: string };

export type Lifestyle = Partial<Record<
  "cleanliness" | "sleep" | "food" | "cooking" | "smoking" | "drinking" | "guests" | "pets" | "wfh" | "noise" | "social" | "religion",
  string
>>;

export type PublicCard = {
  id: string;
  name: string;
  age: number;
  gender: string;
  photos: string[];
  occupation: string;
  organisation?: string;
  bio?: string;
  languages: string[];
  lookingType: "has_flat" | "needs_flat";
  city: string;
  localities: string[];
  budgetMin?: number;
  budgetMax?: number;
  moveInDate?: string;
  roomType?: string;
  flat?: { rent?: number; deposit?: number; furnishing?: string; locality?: string; photos: string[] };
  lifestyle: Lifestyle;
  isVerified: boolean;
  score: number;
  reasons: string[];
  distanceLabel?: string;
};

export type MapFeatureProps = {
  id: string;
  name: string;
  age: number;
  photo: string;
  score: number;
  kind: "person" | "flat";
  rentLabel?: string;
  locality?: string;
  distanceLabel: string;
};

export type ChatMessage = {
  id: string;
  clientId?: string;
  matchId: string;
  sender: string;
  text: string;
  imageUrl?: string;
  createdAt: string;
  readAt?: string | null;
  status?: "queued" | "sending" | "sent" | "failed";
};

export type MatchListItem = {
  matchId: string;
  other: { id: string; name: string; photo: string; age?: number; isVerified: boolean };
  createdAt: string;
  lastMessageAt?: string;
  lastMessage?: { text: string; mine: boolean; hasImage?: boolean };
  unread: number;
};

export type DiscoverFilters = {
  budgetMin?: number;
  budgetMax?: number;
  locality?: string;
  moveInBefore?: string;
  lookingType?: "has_flat" | "needs_flat" | "any";
};

export type ActionResult<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };
