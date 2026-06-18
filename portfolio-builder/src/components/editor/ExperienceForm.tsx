/**
 * ExperienceForm — add, edit, and remove work experience entries.
 *
 * Features:
 *  - "Add Work Experience" button (max 20 entries)
 *  - Each entry is a collapsible card with company, role, dates, and description
 *  - "Currently working here" checkbox hides the end date
 *  - Immediate DELETE API call on remove
 *  - Debounced PUT on field change (1 s) to avoid spamming the server
 *  - On mount: loads existing entries from GET /api/portfolio/experience
 *  - Date display format: MM/YYYY (stored in DB as YYYY-MM)
 *
 * Requirements: 6.1–6.6
 */

"use client";

import { useState, useEffect, useRef } from "react";
import type { PortfolioDTO, WorkExperienceDTO } from "@/src/types/portfolio";

// Maximum allowed experience entries (Requirement 6.3)
const MAX_EXPERIENCES = 20;

// Character limit for description (Requirement 6.6)
const MAX_DESC = 500;

interface ExperienceFormProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

// Internal shape — same as WorkExperienceDTO but with display-format dates
interface ExperienceItem extends WorkExperienceDTO {
  // startDate and endDate here are stored in "YYYY-MM" format (matching the DB)
  // We show them to the user as "MM/YYYY" via the formatForDisplay helper
}

// ── Date conversion helpers ──────────────────────────────────────────────────

/**
 * Convert a user-typed "MM/YYYY" string to "YYYY-MM" for DB storage.
 * Returns the original string if it doesn't match the expected format.
 */
function toStorageFormat(display: string): string {
  // Matches "01/2023" → "2023-01"
  const match = display.match(/^(\d{2})\/(\d{4})$/);
  if (match) return `${match[2]}-${match[1]}`;
  return display;
}

/**
 * Convert a "YYYY-MM" string from the DB to "MM/YYYY" for display.
 * Returns the original string if it doesn't match.
 */
function toDisplayFormat(storage: string): string {
  // Matches "2023-01" → "01/2023"
  const match = storage.match(/^(\d{4})-(\d{2})$/);
  if (match) return `${match[2]}/${match[1]}`;
  return storage;
}

export default function ExperienceForm({ setPortfolio }: ExperienceFormProps) {
  // List of work experience entries with their IDs
  const [experiences, setExperiences] = useState<ExperienceItem[]>([]);
  // Set of IDs for cards that are currently expanded (showing their fields)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Error shown when the user tries to exceed the max limit
  const [limitError, setLimitError] = useState<string | null>(null);
  // True while a POST (add) request is in flight
  const [isAdding, setIsAdding] = useState(false);
  // Track ongoing save timers per entry id
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Load existing entries on mount ────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/portfolio/experience");
        if (res.ok) {
          const data = await res.json();
          const items: ExperienceItem[] = (data.experiences ?? []);
          setExperiences(items);
          syncToPortfolio(items);
        }
      } catch {
        console.warn("Could not load work experiences");
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Push the current list to shared portfolio state for the preview. */
  function syncToPortfolio(items: ExperienceItem[]) {
    setPortfolio((prev) =>
      prev ? { ...prev, experiences: items as WorkExperienceDTO[] } : prev
    );
  }

  /** Toggle a card between collapsed and expanded. */
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /**
   * Add a blank experience: POST to API, then expand the new card.
   */
  async function handleAdd() {
    setLimitError(null);
    if (experiences.length >= MAX_EXPERIENCES) {
      setLimitError(`You can add up to ${MAX_EXPERIENCES} work experience entries.`);
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/portfolio/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: "",
          role: "",
          startDate: "",
          endDate: null,
          isCurrent: false,
          description: "",
        }),
      });
      if (res.ok) {
        const newEntry: ExperienceItem = await res.json();
        const updated = [...experiences, newEntry];
        setExperiences(updated);
        syncToPortfolio(updated);
        // Auto-expand the new card so the user can immediately fill it in
        setExpandedIds((prev) => new Set(prev).add(newEntry.id));
      }
    } catch {
      console.warn("Could not add experience");
    } finally {
      setIsAdding(false);
    }
  }

  /**
   * Delete an experience immediately via DELETE API.
   */
  async function handleDelete(id: string) {
    try {
      await fetch(`/api/portfolio/experience?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      console.warn("Could not delete experience");
    }
    // Remove from local state regardless of API result (optimistic)
    const updated = experiences.filter((e) => e.id !== id);
    setExperiences(updated);
    syncToPortfolio(updated);
    // Clean up any pending save timer
    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }
  }

  /**
   * Update a field on a specific entry in local state, then debounce a PUT call.
   * `dateField` entries are user-typed "MM/YYYY" strings — we convert on save.
   */
  function handleFieldChange(
    id: string,
    field: keyof ExperienceItem,
    value: string | boolean | null
  ) {
    // Update local state immediately so the UI stays responsive
    const updated = experiences.map((e) => {
      if (e.id !== id) return e;
      const next = { ...e, [field]: value };
      // When "currently working here" is checked, clear the end date
      if (field === "isCurrent" && value === true) {
        next.endDate = null;
      }
      return next;
    });
    setExperiences(updated);
    syncToPortfolio(updated);

    // Debounce the save — wait 1 s after the last keystroke before hitting the API
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const entry = updated.find((e) => e.id === id);
      if (!entry) return;
      try {
        await fetch(`/api/portfolio/experience/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company: entry.company,
            role: entry.role,
            // Convert display format (MM/YYYY) to storage format (YYYY-MM)
            startDate: toStorageFormat(entry.startDate),
            endDate: entry.endDate ? toStorageFormat(entry.endDate) : null,
            isCurrent: entry.isCurrent,
            description: entry.description,
          }),
        });
      } catch {
        console.warn("Could not save experience");
      }
    }, 1000);

    saveTimers.current.set(id, timer);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Work Experience</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isAdding ? "Adding…" : "+ Add Work Experience"}
        </button>
      </div>
      <div className="border-b border-gray-100 mb-5" />

      {/* Max-entries error */}
      {limitError && (
        <p role="alert" className="mb-4 text-xs text-red-600">
          {limitError}
        </p>
      )}

      {/* Empty state */}
      {experiences.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No work experience added yet — click "Add Work Experience" to get started.
        </p>
      )}

      {/* Experience cards */}
      <div className="space-y-4">
        {experiences.map((exp, index) => {
          const isExpanded = expandedIds.has(exp.id);
          // Show a summary line when the card is collapsed
          const summaryText = exp.company || exp.role
            ? `${exp.role || "Role"}${exp.company ? " at " + exp.company : ""}`
            : `Entry ${index + 1}`;

          return (
            <div
              key={exp.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Card header — click to expand/collapse */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => toggleExpand(exp.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                  aria-expanded={isExpanded}
                >
                  {/* Chevron indicator */}
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
                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDelete(exp.id)}
                  className="ml-2 text-xs text-red-500 hover:text-red-700 transition"
                  aria-label={`Delete ${summaryText}`}
                >
                  Delete
                </button>
              </div>

              {/* Expandable fields */}
              {isExpanded && (
                <div className="px-4 py-4 space-y-4">
                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={exp.company}
                      onChange={(e) => handleFieldChange(exp.id, "company", e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p className="mt-0.5 text-xs text-gray-400 text-right">
                      {exp.company.length}/100
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role / Job Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={exp.role}
                      onChange={(e) => handleFieldChange(exp.id, "role", e.target.value)}
                      placeholder="e.g. Software Engineer"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p className="mt-0.5 text-xs text-gray-400 text-right">
                      {exp.role.length}/100
                    </p>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="text"
                      value={toDisplayFormat(exp.startDate)}
                      onChange={(e) =>
                        handleFieldChange(exp.id, "startDate", e.target.value)
                      }
                      placeholder="MM/YYYY"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                  </div>

                  {/* Currently working here checkbox */}
                  <div className="flex items-center gap-2">
                    <input
                      id={`current-${exp.id}`}
                      type="checkbox"
                      checked={exp.isCurrent}
                      onChange={(e) =>
                        handleFieldChange(exp.id, "isCurrent", e.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor={`current-${exp.id}`}
                      className="text-sm text-gray-700"
                    >
                      Currently working here
                    </label>
                  </div>

                  {/* End Date — only shown when isCurrent is false */}
                  {!exp.isCurrent && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="text"
                        value={exp.endDate ? toDisplayFormat(exp.endDate) : ""}
                        onChange={(e) =>
                          handleFieldChange(exp.id, "endDate", e.target.value || null)
                        }
                        placeholder="MM/YYYY"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      maxLength={MAX_DESC}
                      value={exp.description}
                      onChange={(e) =>
                        handleFieldChange(exp.id, "description", e.target.value)
                      }
                      placeholder="Describe your responsibilities and achievements…"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p
                      className={`mt-0.5 text-xs text-right ${
                        exp.description.length >= MAX_DESC
                          ? "text-red-500 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {exp.description.length}/{MAX_DESC}
                    </p>
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
