import "server-only";
import { redirect } from "next/navigation";
import { getSessionUserId } from "./auth";
import { connectDB } from "./db";
import { User, type UserDoc } from "@/models";

export class AuthError extends Error {
  constructor(message = "Not signed in") {
    super(message);
  }
}

/** Current user id from the JWT, or null. */
export async function getUserId() {
  const id = await getSessionUserId();
  return id && /^[a-f0-9]{24}$/i.test(id) ? id : null;
}

/** For Server Actions / route handlers — throws if signed out. */
export async function requireUser(): Promise<UserDoc> {
  const id = await getUserId();
  if (!id) throw new AuthError();
  await connectDB();
  const user = await User.findById(id).lean<UserDoc>();
  if (!user) throw new AuthError("Account not found");
  return user;
}

/** For pages — redirects instead of throwing. */
export async function requirePageUser({ onboarded = true } = {}): Promise<UserDoc> {
  const id = await getUserId();
  if (!id) redirect("/login");
  await connectDB();
  const user = await User.findById(id).lean<UserDoc>();
  if (!user) redirect("/login");
  if (onboarded && !user.onboardingComplete) redirect("/onboarding");
  return user;
}

/** Touch lastActive at most every 10 minutes. */
export async function touchActive(user: UserDoc) {
  const last = user.lastActive ? new Date(user.lastActive).getTime() : 0;
  if (Date.now() - last > 10 * 60 * 1000) {
    await User.updateOne({ _id: user._id }, { $set: { lastActive: new Date() } });
  }
}
