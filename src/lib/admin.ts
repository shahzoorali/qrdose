import { currentUser } from "./session";
import type { User } from "./types";

/**
 * Full user record for the logged-in session, but only if they are an admin.
 * Returns null for anonymous or non-admin users. Used to gate the admin
 * dashboard pages and every /api/admin/* route.
 */
export async function currentAdmin(): Promise<User | null> {
  const user = await currentUser();
  if (!user || user.isAdmin !== true) return null;
  return user;
}
