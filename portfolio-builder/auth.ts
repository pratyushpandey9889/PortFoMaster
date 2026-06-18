/**
 * Full NextAuth v5 configuration with Credentials provider.
 *
 * This file is used by API routes and server components — it runs in the
 * Node.js runtime where Prisma (and the `path` module) are available.
 *
 * ⚠️  Do NOT import this file from middleware.ts — the middleware runs on
 * the Edge Runtime which cannot use Node.js modules. Instead, middleware
 * imports from auth.config.ts (the edge-safe subset of this config).
 *
 * Exports:
 *   - handlers: GET/POST for /api/auth/[...nextauth]
 *   - auth:     reads the session (use in API routes and Server Components)
 *   - signIn:   programmatic sign-in
 *   - signOut:  programmatic sign-out
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Spread the edge-safe config (pages, session, callbacks) so behaviour is consistent
  ...authConfig,

  providers: [
    Credentials({
      // Describe the expected credential fields
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      /**
       * Called on every sign-in attempt with the Credentials provider.
       * Returns a user object on success, null on failure.
       */
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;

        // Reject if either field is missing
        if (!email || !password) return null;

        // Look up the user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        // Verify the password against the stored bcrypt hash
        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) return null;

        // Return the user object — fields get encoded into the JWT
        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
        };
      },
    }),
  ],
});
