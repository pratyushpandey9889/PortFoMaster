/**
 * SocialLinksForm — edit the four social link fields.
 *
 * Fields:
 *  - GitHub URL    (must start with https://)
 *  - LinkedIn URL  (must start with https://)
 *  - Twitter URL   (must start with https://)
 *  - Email         (must start with mailto:)
 *
 * Each field shows an inline error on blur if the value is non-empty and invalid.
 * Changes are reflected in `portfolio.socialLinks` immediately (for live preview).
 * The actual server save happens via the main PUT /api/portfolio route (triggered
 * by the Save button), not here — social links are included in that payload.
 *
 * Requirements: 9.1–9.5
 */

"use client";

import { useState, useEffect } from "react";
import { validateHttpsUrl, validateMailtoUrl } from "@/src/lib/validators";
import type { PortfolioDTO, SocialLinkDTO } from "@/src/types/portfolio";

interface SocialLinksFormProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

// The four supported social link types and their display labels
const SOCIAL_FIELDS: {
  type: SocialLinkDTO["type"];
  label: string;
  placeholder: string;
}[] = [
  {
    type: "github",
    label: "GitHub URL",
    placeholder: "https://github.com/username",
  },
  {
    type: "linkedin",
    label: "LinkedIn URL",
    placeholder: "https://linkedin.com/in/username",
  },
  {
    type: "twitter",
    label: "Twitter / X URL",
    placeholder: "https://twitter.com/username",
  },
  {
    type: "email",
    label: "Email",
    placeholder: "mailto:you@example.com",
  },
];

export default function SocialLinksForm({
  portfolio,
  setPortfolio,
}: SocialLinksFormProps) {
  // Local state: a map from social type to its URL string (for controlled inputs)
  const [values, setValues] = useState<Record<SocialLinkDTO["type"], string>>({
    github: "",
    linkedin: "",
    twitter: "",
    email: "",
  });

  // Field-level errors: keyed by social link type
  const [errors, setErrors] = useState<
    Partial<Record<SocialLinkDTO["type"], string>>
  >({});

  // ── Initialise from portfolio on mount / when portfolio changes ────────────
  useEffect(() => {
    if (!portfolio) return;
    // Build a lookup from the socialLinks array
    const map: Record<SocialLinkDTO["type"], string> = {
      github: "",
      linkedin: "",
      twitter: "",
      email: "",
    };
    for (const link of portfolio.socialLinks) {
      map[link.type] = link.url;
    }
    setValues(map);
  }, [portfolio?.socialLinks]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Handle input changes: update local state and sync to portfolio.socialLinks.
   * Clears the error for the changed field.
   */
  function handleChange(type: SocialLinkDTO["type"], value: string) {
    const updated = { ...values, [type]: value };
    setValues(updated);
    // Clear the error while the user is typing
    if (errors[type]) {
      setErrors((prev) => ({ ...prev, [type]: undefined }));
    }
    syncToPortfolio(updated);
  }

  /**
   * Validate the field on blur and set an error if the value is non-empty and invalid.
   * (Requirement 9.2–9.3)
   */
  function handleBlur(type: SocialLinkDTO["type"]) {
    const value = values[type].trim();
    if (!value) {
      // Empty is fine — optional field
      setErrors((prev) => ({ ...prev, [type]: undefined }));
      return;
    }
    const result =
      type === "email" ? validateMailtoUrl(value) : validateHttpsUrl(value);
    setErrors((prev) => ({
      ...prev,
      [type]: result.ok ? undefined : result.error,
    }));
  }

  /**
   * Push the current values map into portfolio.socialLinks.
   * Only non-empty values are included (Requirement 9.5).
   */
  function syncToPortfolio(vals: Record<SocialLinkDTO["type"], string>) {
    const links: SocialLinkDTO[] = (
      Object.entries(vals) as [SocialLinkDTO["type"], string][]
    )
      .filter(([, url]) => url.trim() !== "")
      .map(([type, url]) => ({ type, url: url.trim() }));

    setPortfolio((prev) => (prev ? { ...prev, socialLinks: links } : prev));
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">Social Links</h3>
      <p className="text-xs text-gray-500 mb-5">
        All fields are optional. Leave blank to hide from your public page.
      </p>
      <div className="border-b border-gray-100 mb-5" />

      <div className="space-y-5">
        {SOCIAL_FIELDS.map(({ type, label, placeholder }) => (
          <div key={type}>
            <label
              htmlFor={`social-${type}`}
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {label}
            </label>
            <input
              id={`social-${type}`}
              type="text"
              value={values[type]}
              onChange={(e) => handleChange(type, e.target.value)}
              onBlur={() => handleBlur(type)}
              placeholder={placeholder}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition ${
                errors[type]
                  ? "border-red-400 focus:ring-red-400"
                  : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
              }`}
            />
            {/* Inline error message (Requirement 9.3) */}
            {errors[type] && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors[type]}
              </p>
            )}
            {/* Format hint */}
            {!errors[type] && (
              <p className="mt-0.5 text-xs text-gray-400">
                {type === "email" ? "Format: mailto:you@example.com" : "Must start with https://"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
