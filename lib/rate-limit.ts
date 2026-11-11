import { RateLimit } from "@/models";

/**
 * Fixed-window rate limiter backed by MongoDB (TTL index cleans up old windows).
 * Returns { ok, remaining }. Call connectDB() before using.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = `${key}:${windowStart}`;
  const expiresAt = new Date((windowStart + 1) * windowSeconds * 1000);
  const doc = await RateLimit.findOneAndUpdate(
    { key: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
    { upsert: true, new: true },
  ).lean();
  const count = doc?.count ?? 1;
  return { ok: count <= limit, remaining: Math.max(0, limit - count) };
}
