import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { AuthError, requireUser } from "@/lib/session";
import { CARD_PROJECTION, buildCandidateQuery, isBlockedPair, toPublicCard } from "@/lib/matching";
import { Match, User, pairKeyOf, type UserDoc } from "@/models";

type Ctx = { params: Promise<{ userId: string }> };

/** Public card of someone I'm matched with, or someone who passes my hard filters. Never email/location. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { userId } = await params;
    if (!Types.ObjectId.isValid(userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const me = await requireUser();
    if (await isBlockedPair(me._id, userId)) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const matched = await Match.exists({ pairKey: pairKeyOf(String(me._id), userId), isActive: true });
    const query = matched
      ? { _id: new Types.ObjectId(userId) }
      : { $and: [buildCandidateQuery(me, []), { _id: new Types.ObjectId(userId) }] };
    const u = await User.findOne(query, CARD_PROJECTION).lean<UserDoc>();
    if (!u) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ card: toPublicCard(u, me) });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
