import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe base config (no DB / bcrypt). Shared by middleware and the full
 * Node-runtime config in auth.ts. Keeping DB-dependent code out of here lets
 * middleware run on the edge.
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/admin");
      if (isProtected && !isLoggedIn) return false;
      return true;
    },
    jwt({ token, user }) {
      if (user) token.userId = (user as { id: string }).id;
      return token;
    },
    session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
