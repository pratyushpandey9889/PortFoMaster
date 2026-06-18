/**
 * Edge-compatible NextAuth configuration.
 *
 * This file contains the NextAuth config WITHOUT the Credentials provider's
 * `authorize` function — that function imports Prisma (a Node.js module),
 * which cannot run in the Edge Runtime used by middleware.ts.
 *
 * The middleware only needs to verify the JWT cookie, which this config handles.
 * The full `auth.ts` (with Prisma) handles the actual sign-in flow in API routes.
 *
 * Pattern from: https://authjs.dev/guides/edge-compatibility
 */

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  // Redirect unauthenticated users to our custom login page
  pages: { signIn: "/login" },

  // Session via JWT (no DB needed for cookie validation)
  session: { strategy: "jwt" },

  callbacks: {
    /**
     * authorized callback — used by middleware to decide whether to allow access.
     * Returns true (allow) or false (redirect to signIn page).
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isEditorRoute = nextUrl.pathname.startsWith("/editor");

      if (isEditorRoute) {
        // Allow if logged in; redirect to /login if not
        return isLoggedIn;
      }

      // Allow all other routes unconditionally
      return true;
    },

    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.username = (user as any).username;
      }
      return token;
    },

    session({ session, token }) {
      session.user.id = token.id as string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session.user as any).username = token.username;
      return session;
    },
  },

  // No providers here — the Credentials provider (which uses Prisma) is in auth.ts
  providers: [],
};
