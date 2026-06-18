/**
 * Augment the default NextAuth session types to include our custom fields.
 *
 * NextAuth's default `session.user` only has { name?, email?, image? }.
 * We extend it to also include:
 *   - `id`:       the database User.id (cuid string)
 *   - `username`: the unique username used in public portfolio URLs
 *
 * This file is automatically picked up by TypeScript thanks to the
 * `declare module "next-auth"` ambient module declaration.
 */

import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id?: string;
    username?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}
