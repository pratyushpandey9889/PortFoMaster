/**
 * PersonalInfoForm — edits the user's name, professional title, and location.
 *
 * This is a controlled form: every input is wired directly to the `portfolio`
 * state object. Typing in any field immediately calls `setPortfolio`, which
 * updates the live preview on the right side of the editor.
 *
 * Field limits (from Requirement 3.1):
 *   - Full Name       : max 100 characters
 *   - Professional Title : max 100 characters
 *   - Location        : max 100 characters
 */

"use client";

import type { PortfolioDTO } from "@/src/types/portfolio";

// Maximum length shared across all three fields
const MAX_LENGTH = 100;

interface PersonalInfoFormProps {
  /** The current portfolio state — used as the source of truth for each input. */
  portfolio: PortfolioDTO | null;
  /** Callback to update the portfolio state. Pass a function to merge changes. */
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

export default function PersonalInfoForm({
  portfolio,
  setPortfolio,
}: PersonalInfoFormProps) {
  // Nothing to render while the portfolio is still loading
  if (!portfolio) return null;
  /**
   * Generic field updater: merges a single key/value pair into portfolio state.
   * We use the functional form of setState so we always work with the latest state.
   */
  function handleChange(
    field: "name" | "title" | "location",
    value: string
  ) {
    setPortfolio((prev) =>
      prev ? { ...prev, [field]: value } : prev
    );
  }

  return (
    // White card with subtle shadow, matching the auth page style
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Personal Information
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        This appears at the top of your public portfolio.
      </p>

      <div className="space-y-5">
        {/* ── Full Name ──────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="pi-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full Name
          </label>
          <input
            id="pi-name"
            type="text"
            maxLength={MAX_LENGTH}
            value={portfolio.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Jane Doe"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {/* Character hint: shows remaining characters */}
          <p className="mt-1 text-xs text-gray-400 text-right">
            {portfolio.name.length}/{MAX_LENGTH}
          </p>
        </div>

        {/* ── Professional Title ─────────────────────────────────────── */}
        <div>
          <label
            htmlFor="pi-title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Professional Title
          </label>
          <input
            id="pi-title"
            type="text"
            maxLength={MAX_LENGTH}
            value={portfolio.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g. Full-Stack Developer"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400 text-right">
            {portfolio.title.length}/{MAX_LENGTH}
          </p>
        </div>

        {/* ── Location ───────────────────────────────────────────────── */}
        <div>
          <label
            htmlFor="pi-location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
          </label>
          <input
            id="pi-location"
            type="text"
            maxLength={MAX_LENGTH}
            value={portfolio.location}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="e.g. San Francisco, CA"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <p className="mt-1 text-xs text-gray-400 text-right">
            {portfolio.location.length}/{MAX_LENGTH}
          </p>
        </div>
      </div>
    </div>
  );
}
