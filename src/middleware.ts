import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe middleware using the lightweight config (no DB/bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protect the portal. Public routes (/, /login, /signup, /t/*, /api/*)
  // are excluded; API auth is enforced per-route via auth().
  matcher: ["/dashboard/:path*"],
};
