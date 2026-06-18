/**
 * Catch-all route handler for NextAuth.js.
 *
 * NextAuth needs a single dynamic route at /api/auth/[...nextauth] to handle:
 *   GET  /api/auth/session         — returns current session info
 *   GET  /api/auth/providers       — lists configured auth providers
 *   GET  /api/auth/csrf            — returns a CSRF token
 *   POST /api/auth/callback/credentials  — processes credential sign-in
 *   POST /api/auth/signout         — signs the user out
 *   ...and more
 *
 * We simply re-export the GET and POST handlers produced by our auth.ts config.
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
