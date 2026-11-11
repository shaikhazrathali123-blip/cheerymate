import { NextResponse } from "next/server";
import { getUserId } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { getUnreadTotal } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const id = await getUserId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  return NextResponse.json({ total: await getUnreadTotal(id) }, { headers: { "Cache-Control": "no-store" } });
}
