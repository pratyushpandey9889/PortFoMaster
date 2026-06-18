"use client";

/**
 * Registration page (/register)
 *
 * A client-side form that lets new visitors create an account.
 * Flow:
 *   1. User fills in email, password, and username.
 *   2. Client-side validation runs on each field as the user types (and on submit).
 *   3. On submit: POST to /api/auth/register.
 *   4. If registration succeeds, automatically sign the user in and redirect to /editor.
 *   5. Any server error (duplicate email/username, etc.) is shown as a form-level error.
 */

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/src/lib/validators";

export default function RegisterPage() {
  const router = useRouter();

  // ── Form field state ───────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // ── Per-field validation error messages ───────────────────────────────────
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [usernameError, setUsernameError] = useState("");

  // ── Top-level form error (e.g. duplicate email from server) ───────────────
  const [formError, setFormError] = useState("");

  // ── Loading state while the API request is in flight ─────────────────────
  const [isLoading, setIsLoading] = useState(false);

  // ── Inline validators (called on blur and on submit) ──────────────────────

  function checkEmail(value: string) {
    const result = validateEmail(value);
    setEmailError(result.ok ? "" : (result.error ?? "Invalid email"));
    return result.ok;
  }

  function checkPassword(value: string) {
    const result = validatePassword(value);
    setPasswordError(result.ok ? "" : (result.error ?? "Invalid password"));
    return result.ok;
  }

  function checkUsername(value: string) {
    const result = validateUsername(value);
    setUsernameError(result.ok ? "" : (result.error ?? "Invalid username"));
    return result.ok;
  }

  // ── Form submit handler ────────────────────────────────────────────────────
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    // Run all client-side validations before hitting the server
    const emailOk = checkEmail(email);
    const passwordOk = checkPassword(password);
    const usernameOk = checkUsername(username);

    if (!emailOk || !passwordOk || !usernameOk) return;

    setIsLoading(true);

    try {
      // Step 1: Call the registration API
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Show server-side errors (e.g. "Email already registered")
        setFormError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      // Step 2: Automatically sign in with the new credentials
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Unlikely after a successful registration, but handle gracefully
        setFormError("Account created, but sign-in failed. Please log in.");
        router.push("/login");
        return;
      }

      // Step 3: Redirect to the editor
      router.push("/editor");
    } catch {
      setFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      {/* Centered card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="mt-1 text-sm text-gray-500">
            Start building your portfolio in minutes
          </p>
        </div>

        {/* Form-level error (server errors like duplicate email) */}
        {formError && (
          <div
            role="alert"
            className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
          >
            {formError}
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
              onBlur={() => checkEmail(email)}
              aria-describedby={emailError ? "email-error" : undefined}
              aria-invalid={!!emailError}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                emailError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
              placeholder="you@example.com"
            />
            {/* Inline error below the field */}
            {emailError && (
              <p id="email-error" className="mt-1 text-xs text-red-600">
                {emailError}
              </p>
            )}
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
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => checkPassword(password)}
              aria-describedby={passwordError ? "password-error" : undefined}
              aria-invalid={!!passwordError}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                passwordError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
              placeholder="At least 8 characters"
            />
            {passwordError && (
              <p id="password-error" className="mt-1 text-xs text-red-600">
                {passwordError}
              </p>
            )}
          </div>

          {/* Username field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => checkUsername(username)}
              aria-describedby={usernameError ? "username-error" : undefined}
              aria-invalid={!!usernameError}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                usernameError ? "border-red-400 bg-red-50" : "border-gray-300 bg-white"
              }`}
              placeholder="e.g. jane-doe"
            />
            {usernameError && (
              <p id="username-error" className="mt-1 text-xs text-red-600">
                {usernameError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Your public portfolio URL will be: /p/
              <span className="font-medium text-gray-600">
                {username || "username"}
              </span>
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? "Creating account…" : "Create account"}
          </button>
        </form>

        {/* Link to login */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
