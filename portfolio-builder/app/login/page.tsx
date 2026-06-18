"use client";

/**
 * Login page (/login)
 *
 * A client-side form that lets registered users sign in.
 * Flow:
 *   1. User enters email and password.
 *   2. On submit: call NextAuth's signIn("credentials", ...) with redirect: false.
 *   3. If successful, redirect to /editor.
 *   4. If failed, show a GENERIC error message — never reveal which field is wrong.
 *      (Security: telling users "email not found" leaks account existence.)
 *
 * We intentionally do NOT show per-field errors on submit failure —
 * only a single generic message, per Requirement 2.3 and 2.4.
 */

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  // ── Form field state ───────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Generic error shown on failed login (never reveals which field is wrong) ─
  const [loginError, setLoginError] = useState("");

  // ── Loading state while the sign-in request is in flight ─────────────────
  const [isLoading, setIsLoading] = useState(false);

  // ── Form submit handler ────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError("");

    // Basic client-side presence check — just ensures fields aren't empty.
    // We do NOT run detailed validators here to avoid leaking info about validity.
    if (!email.trim() || !password) {
      setLoginError("Invalid email or password");
      return;
    }

    setIsLoading(true);

    try {
      // Call NextAuth sign-in with redirect: false so we handle the redirect ourselves
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        // Show a generic message regardless of what went wrong
        // (could be wrong email, wrong password, account not found — we don't say which)
        setLoginError("Invalid email or password");
        return;
      }

      // Success: redirect to the editor
      router.push("/editor");
    } catch {
      // Network or unexpected error
      setLoginError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      {/* Centered card — matches register page style */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back — let&apos;s pick up where you left off
          </p>
        </div>

        {/* Generic login error (shown after a failed attempt) */}
        {loginError && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {loginError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="you@example.com"
            />
          </div>

          {/* Password field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Your password"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        {/* Link to register */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
