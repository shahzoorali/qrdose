import { auth } from "./auth";
import { getUserById } from "./repositories/users";
import type { User } from "./types";

/** Logged-in user id from the session, or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Full user record for the logged-in session, or null. */
export async function currentUser(): Promise<User | null> {
  const id = await currentUserId();
  if (!id) return null;
  return getUserById(id);
}
