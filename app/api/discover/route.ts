import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/session";
import { getDiscoverCards } from "@/lib/discover";
import { discoverQuerySchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const me = await requireUser();
    const rl = await rateLimit(`discover:${me._id}`, 60, 60);
    if (!rl.ok) return NextResponse.json({ error: "Slow down a little" }, { status: 429 });

    const sp = new URL(req.url).searchParams;
    const parsed = discoverQuerySchema.safeParse(Object.fromEntries(sp));
    if (!parsed.success) return NextResponse.json({ error: "Bad filters" }, { status: 400 });
    const exclude = (sp.get("exclude") ?? "").split(",").filter(Boolean).slice(0, 60);
    const cards = await getDiscoverCards(me, parsed.data, exclude);
    return NextResponse.json({ cards }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    console.error(e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
