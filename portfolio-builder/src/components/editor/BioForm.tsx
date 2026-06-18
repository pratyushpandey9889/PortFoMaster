/**
 * BioForm — lets the user write or AI-generate their professional bio.
 *
 * Features:
 *  - Multiline textarea, max 1000 characters
 *  - Live character counter (turns red at 1000)
 *  - "Generate Bio" button that calls POST /api/bio/generate
 *  - Pre-validation: requires name, title, and at least one skill before calling AI
 *  - Shows inline errors for missing fields or API failures
 *  - Loading/disabled state while generation is in progress
 *
 * Requirement 4.1–4.8, Requirement 15
 */

"use client";

import { useState } from "react";
import type { PortfolioDTO } from "@/src/types/portfolio";

// Maximum bio length (Requirement 4.1)
const MAX_BIO_LENGTH = 1000;

interface BioFormProps {
  /** Current portfolio state — used as source of truth for the textarea. */
  portfolio: PortfolioDTO | null;
  /** Update portfolio state on every keystroke. */
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

export default function BioForm({ portfolio, setPortfolio }: BioFormProps) {
  // Track whether a generate request is in flight
  const [isGenerating, setIsGenerating] = useState(false);
  // Error message shown below the textarea (validation or API error)
  const [generateError, setGenerateError] = useState<string | null>(null);

  // The current bio text (fall back to empty string while loading)
  const bioValue = portfolio?.bio ?? "";
  const charCount = bioValue.length;
  // True when at the character limit
  const atLimit = charCount >= MAX_BIO_LENGTH;

  /**
   * Handle every keystroke in the textarea.
   * Updates the shared portfolio state so the live preview reacts immediately.
   */
  function handleBioChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setPortfolio((prev) => (prev ? { ...prev, bio: value } : prev));
  }

  /**
   * Validate prerequisites before calling the AI generator.
   * Returns an error string if something is missing, null if OK.
   * Requirement 4.7
   */
  function getMissingFields(): string | null {
    const missing: string[] = [];
    if (!portfolio?.name?.trim()) missing.push("Full Name");
    if (!portfolio?.title?.trim()) missing.push("Professional Title");
    if (!portfolio?.skills?.length) missing.push("at least one Skill");

    if (missing.length > 0) {
      return `Please fill in: ${missing.join(", ")} before generating a bio.`;
    }
    return null;
  }

  /**
   * Call POST /api/bio/generate with name, title, and skills.
   * On success, populate the bio field.
   * On failure, show the error message.
   * Requirement 4.5–4.6, 15.1–15.5
   */
  async function handleGenerateBio() {
    setGenerateError(null);

    // Pre-validate required fields
    const missingMsg = getMissingFields();
    if (missingMsg) {
      setGenerateError(missingMsg);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/bio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: portfolio!.name,
          title: portfolio!.title,
          skills: portfolio!.skills,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle rate limit (429) with a specific message
        if (res.status === 429) {
          const seconds = data.retryAfterSeconds ?? 3600;
          const minutes = Math.ceil(seconds / 60);
          setGenerateError(
            `Bio generation limit reached. Try again in ${minutes} minute${minutes !== 1 ? "s" : ""}.`
          );
        } else {
          setGenerateError(data.error ?? "Failed to generate bio. Please try again.");
        }
        return;
      }

      // Populate the bio field with the generated text (Requirement 4.6)
      setPortfolio((prev) => (prev ? { ...prev, bio: data.bio ?? "" } : prev));
    } catch {
      setGenerateError("Failed to generate bio — check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">About / Bio</h3>
      <div className="border-b border-gray-100 mb-5" />

      {/* Bio textarea */}
      <div>
        <label htmlFor="bio-textarea" className="block text-sm font-medium text-gray-700 mb-1">
          Bio
        </label>
        <textarea
          id="bio-textarea"
          rows={5}
          maxLength={MAX_BIO_LENGTH}
          value={bioValue}
          onChange={handleBioChange}
          placeholder="Write a short professional summary about yourself…"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none resize-vertical transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />

        {/* Live character counter — red when at the limit (Requirement 4.2–4.4) */}
        <p className={`mt-1 text-xs text-right ${atLimit ? "text-red-500 font-medium" : "text-gray-400"}`}>
          {charCount}/{MAX_BIO_LENGTH}
          {atLimit && " — character limit reached"}
        </p>
      </div>

      {/* Error message area (validation or API errors) */}
      {generateError && (
        <div
          role="alert"
          className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
        >
          {generateError}
        </div>
      )}

      {/* Generate Bio button (Requirement 4.5) */}
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerateBio}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isGenerating ? (
            <>
              {/* Small spinner */}
              <span className="h-4 w-4 rounded-full border-2 border-indigo-300 border-t-white animate-spin" />
              Generating…
            </>
          ) : (
            <>
              {/* Sparkle icon (inline SVG) */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Generate Bio with AI
            </>
          )}
        </button>

        <p className="text-xs text-gray-400">
          Requires name, title, and at least one skill
        </p>
      </div>
    </div>
  );
}
