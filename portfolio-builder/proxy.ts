/**
 * Next.js 16 Proxy (formerly "Middleware").
 *
 * In Next.js 16, the middleware.ts convention was renamed to proxy.ts.
 * The export must also be renamed from `default` (the middleware function)
 * to a named `proxy` export. Functionality is identical to the old middleware.
 *
 * This proxy runs on the Edge Runtime — no Node.js modules allowed.
 * We use the edge-safe `authConfig` (no Prisma) to verify JWT sessions.
 *
 * Protected routes: everything under /editor
 * Unauthenticated requests are redirected to /login (configured in authConfig.pages).
 *
 * The `authorized` callback in auth.config.ts handles the redirect logic.
 */

import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Create a minimal NextAuth instance using only the edge-safe config.
// This gives us the `auth` proxy wrapper without importing Prisma.
const { auth } = NextAuth(authConfig);

// Named `proxy` export is required by Next.js 16 (replaces the old default export)
export { auth as proxy };

/**
 * Run this proxy only on /editor routes.
 * The matcher array tells Next.js which requests trigger this function.
 */
export const config = { matcher: ["/editor/:path*"] };
