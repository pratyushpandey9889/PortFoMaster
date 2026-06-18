/**
 * Landing page (/)
 *
 * The first page visitors see. It introduces the app and provides
 * two clear calls-to-action: register or sign in.
 *
 * This is a Server Component — no interactivity needed here, so there's
 * no "use client" directive. Server Components are faster because they
 * render on the server and send plain HTML to the browser.
 */

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      {/* Hero section */}
      <div className="text-center max-w-xl">
        {/* App name */}
        <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
          Portfolio Builder
        </h1>

        {/* Tagline */}
        <p className="mt-4 text-lg text-gray-600 leading-relaxed">
          Build a beautiful, shareable portfolio in minutes — no coding needed.
          Just fill in your details, pick a theme, and share your unique link.
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Primary: Register */}
          <Link
            href="/register"
            className="w-full sm:w-auto rounded-xl bg-indigo-600 px-8 py-3 text-base font-semibold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition text-center"
          >
            Get Started
          </Link>

          {/* Secondary: Login */}
          <Link
            href="/login"
            className="w-full sm:w-auto rounded-xl border border-gray-300 bg-white px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition text-center"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Subtle feature highlights */}
      <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl text-center">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">✏️</div>
          <h2 className="font-semibold text-gray-800">Easy Editor</h2>
          <p className="mt-1 text-sm text-gray-500">
            Fill in your details with our guided, split-screen editor and see
            changes in real time.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">🎨</div>
          <h2 className="font-semibold text-gray-800">Pick a Theme</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose from Minimal, Dark, or Creative — your portfolio, your style.
          </p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-3xl mb-3">🔗</div>
          <h2 className="font-semibold text-gray-800">Instant Share</h2>
          <p className="mt-1 text-sm text-gray-500">
            Get a unique public URL like{" "}
            <span className="font-mono text-indigo-600">/p/your-name</span>{" "}
            the moment you register.
          </p>
        </div>
      </div>
    </div>
  );
}
