import { NextResponse } from "next/server";
import { z } from "zod";
import { getUserId } from "@/lib/session";
import { cloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { Match } from "@/models";
import { objectId } from "@/lib/validators";

const bodySchema = z.object({
  kind: z.enum(["profile", "flat", "chat"]),
  matchId: objectId.optional(),
});

/** Returns signed params for a direct browser → Cloudinary upload. */
export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!cloudinaryConfigured()) {
    return NextResponse.json({ error: "Image uploads are not configured (set CLOUDINARY_* env vars)." }, { status: 503 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });

  await connectDB();
  const rl = await rateLimit(`upload:${userId}`, 40, 60 * 60);
  if (!rl.ok) return NextResponse.json({ error: "Too many uploads, try again later." }, { status: 429 });

  let folder = `cherrymate/users/${userId}/${parsed.data.kind}`;
  if (parsed.data.kind === "chat") {
    const match = parsed.data.matchId
      ? await Match.findOne({ _id: parsed.data.matchId, users: userId, isActive: true }, { _id: 1 }).lean()
      : null;
    if (!match) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    folder = `cherrymate/chats/${parsed.data.matchId}`;
  }
  return NextResponse.json(signUpload(folder));
}
