/**
 * Providers — client-side context providers wrapper.
 *
 * This component wraps the app in all providers that require "use client"
 * (e.g., NextAuth's SessionProvider). It is imported by the root layout
 * (app/layout.tsx), which is a Server Component, so the providers file
 * itself must be a Client Component.
 *
 * Adding a new provider: just nest it inside the existing ones here.
 */

"use client";

import { SessionProvider } from "next-auth/react";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    // SessionProvider makes useSession() available anywhere in the tree.
    <SessionProvider>{children}</SessionProvider>
  );
}
