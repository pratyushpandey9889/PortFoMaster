/**
 * PortfolioNotFound — Custom 404 page for the /p/[username] namespace.
 *
 * Shown when a visitor navigates to /p/[username] and the username
 * does not exist in the database (Requirement 13.6).
 *
 * This file is scoped to the /app/p/[username]/ segment, so it only
 * overrides the 404 for portfolio URLs — other 404s use the root not-found.
 */

export default function PortfolioNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">Portfolio not found</h1>
        <p className="mt-2 text-gray-500">
          The portfolio you&apos;re looking for doesn&apos;t exist.
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-indigo-600 underline hover:text-indigo-800"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
