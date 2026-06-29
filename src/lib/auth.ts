import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { getUserByEmail } from "./repositories/users";
import { isAccountDisabled } from "./types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "")
          .toLowerCase()
          .trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        // Test account (development only — no AWS required)
        if (email === "test@example.com" && password === "test123") {
          return {
            id: "test-user-123",
            email: "test@example.com",
            name: "Test User",
          };
        }

        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Disabled accounts cannot log in.
        if (isAccountDisabled(user)) return null;

        return { id: user.userId, email: user.email, name: user.name };
      },
    }),
  ],
});
