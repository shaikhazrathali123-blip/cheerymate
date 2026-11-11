import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySession } from "./session-token";

/** Current signed-in user id from our session cookie, or null. */
export async function getSessionUserId() {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

/** Clears the session cookie and redirects (use from Server Actions). */
export async function signOut(redirectTo = "/") {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect(redirectTo);
}
