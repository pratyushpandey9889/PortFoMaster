/**
 * EducationForm — add, edit, and remove education entries.
 *
 * Features:
 *  - "Add Education" button (max 10 entries)
 *  - Each entry card: degree, institution, graduation year
 *  - Graduation year validated on blur using validateGraduationYear (1900–2100)
 *  - Immediate DELETE API call on remove
 *  - Debounced PUT on field change (1 s)
 *  - On mount: loads existing entries from GET /api/portfolio/education
 *
 * Requirements: 8.1–8.5
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { validateGraduationYear } from "@/src/lib/validators";
import type { PortfolioDTO, EducationDTO } from "@/src/types/portfolio";

// Maximum allowed education entries (Requirement 8.3)
const MAX_EDUCATIONS = 10;

interface EducationFormProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

// Internal shape — extends the DTO with a field-level error for graduation year
interface EducationItem extends EducationDTO {
  yearError?: string;
}

export default function EducationForm({ setPortfolio }: EducationFormProps) {
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/portfolio/education");
        if (res.ok) {
          const data = await res.json();
          const items: EducationItem[] = data.educations ?? [];
          setEducations(items);
          syncToPortfolio(items);
        }
      } catch {
        console.warn("Could not load education entries");
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Push the current list (without UI-only error field) to shared portfolio state. */
  function syncToPortfolio(items: EducationItem[]) {
    setPortfolio((prev) =>
      prev
        ? {
            ...prev,
            educations: items.map(({ yearError: _e, ...rest }) => rest as EducationDTO),
          }
        : prev
    );
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** Add a blank education entry. */
  async function handleAdd() {
    setLimitError(null);
    if (educations.length >= MAX_EDUCATIONS) {
      setLimitError(`You can add up to ${MAX_EDUCATIONS} education entries.`);
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/portfolio/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          degree: "",
          institution: "",
          graduationYear: new Date().getFullYear(),
        }),
      });
      if (res.ok) {
        const newEntry: EducationDTO = await res.json();
        const item: EducationItem = { ...newEntry };
        const updated = [...educations, item];
        setEducations(updated);
        syncToPortfolio(updated);
        setExpandedIds((prev) => new Set(prev).add(newEntry.id));
      }
    } catch {
      console.warn("Could not add education entry");
    } finally {
      setIsAdding(false);
    }
  }

  /** Delete an education entry immediately. */
  async function handleDelete(id: string) {
    try {
      await fetch(`/api/portfolio/education?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      console.warn("Could not delete education entry");
    }
    const updated = educations.filter((e) => e.id !== id);
    setEducations(updated);
    syncToPortfolio(updated);
    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }
  }

  /**
   * Update a text field (degree or institution) and schedule a debounced save.
   */
  function handleTextChange(
    id: string,
    field: "degree" | "institution",
    value: string
  ) {
    const updated = educations.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    );
    setEducations(updated);
    syncToPortfolio(updated);
    scheduleSave(id, updated);
  }

  /**
   * Update graduation year — store as a number.
   * Validation happens on blur via handleYearBlur.
   */
  function handleYearChange(id: string, raw: string) {
    const parsed = parseInt(raw, 10);
    const value = isNaN(parsed) ? 0 : parsed;
    const updated = educations.map((e) =>
      // Keep the raw string for display purposes; store the parsed int
      e.id === id ? { ...e, graduationYear: value, yearError: undefined } : e
    );
    setEducations(updated);
    syncToPortfolio(updated);
    scheduleSave(id, updated);
  }

  /** Validate graduation year on blur and show a field-level error if invalid. */
  function handleYearBlur(id: string, raw: string) {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) {
      setEducations((prev) =>
        prev.map((e) =>
          e.id === id ? { ...e, yearError: "Please enter a valid year" } : e
        )
      );
      return;
    }
    const result = validateGraduationYear(parsed);
    setEducations((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, yearError: result.ok ? undefined : result.error }
          : e
      )
    );
  }

  /** Schedule a debounced PUT for the given education entry. */
  function scheduleSave(id: string, items: EducationItem[]) {
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const entry = items.find((e) => e.id === id);
      if (!entry) return;
      try {
        await fetch(`/api/portfolio/education/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            degree: entry.degree,
            institution: entry.institution,
            graduationYear: entry.graduationYear,
          }),
        });
      } catch {
        console.warn("Could not save education entry");
      }
    }, 1000);

    saveTimers.current.set(id, timer);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Education</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isAdding ? "Adding…" : "+ Add Education"}
        </button>
      </div>
      <div className="border-b border-gray-100 mb-5" />

      {limitError && (
        <p role="alert" className="mb-4 text-xs text-red-600">
          {limitError}
        </p>
      )}

      {educations.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No education entries added yet — click "Add Education" to get started.
        </p>
      )}

      <div className="space-y-4">
        {educations.map((edu, index) => {
          const isExpanded = expandedIds.has(edu.id);
          const summaryText =
            edu.degree || edu.institution
              ? `${edu.degree || "Degree"}${edu.institution ? " — " + edu.institution : ""}`
              : `Entry ${index + 1}`;

          return (
            <div
              key={edu.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => toggleExpand(edu.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                  aria-expanded={isExpanded}
                >
                  <svg
                    className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {summaryText}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(edu.id)}
                  className="ml-2 text-xs text-red-500 hover:text-red-700 transition"
                  aria-label={`Delete ${summaryText}`}
                >
                  Delete
                </button>
              </div>

              {/* Expandable fields */}
              {isExpanded && (
                <div className="px-4 py-4 space-y-4">
                  {/* Degree */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Degree / Qualification <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={edu.degree}
                      onChange={(e) =>
                        handleTextChange(edu.id, "degree", e.target.value)
                      }
                      placeholder="e.g. B.Sc. Computer Science"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p className="mt-0.5 text-xs text-gray-400 text-right">
                      {edu.degree.length}/150
                    </p>
                  </div>

                  {/* Institution */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Institution <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={150}
                      value={edu.institution}
                      onChange={(e) =>
                        handleTextChange(edu.id, "institution", e.target.value)
                      }
                      placeholder="e.g. University of California"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p className="mt-0.5 text-xs text-gray-400 text-right">
                      {edu.institution.length}/150
                    </p>
                  </div>

                  {/* Graduation Year */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      min={1900}
                      max={2100}
                      value={edu.graduationYear || ""}
                      onChange={(e) => handleYearChange(edu.id, e.target.value)}
                      onBlur={(e) => handleYearBlur(edu.id, e.target.value)}
                      placeholder="e.g. 2024"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition ${
                        edu.yearError
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {edu.yearError && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {edu.yearError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
