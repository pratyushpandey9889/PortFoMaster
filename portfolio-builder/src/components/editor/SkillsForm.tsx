/**
 * SkillsForm — add and remove skill tags.
 *
 * Features:
 *  - Text input + "Add" button (also submits on Enter)
 *  - Chip display for each skill with an × remove button
 *  - Client-side validation: max 50 chars, no duplicates (case-insensitive), max 30 tags
 *  - Add calls POST /api/portfolio/skills; Remove calls DELETE /api/portfolio/skills?id=
 *  - On mount: loads existing skills (with IDs) from GET /api/portfolio/skills
 *  - Keeps a local state of { id, name }[] for API calls; syncs name[] to portfolio.skills
 *
 * Requirements: 5.1–5.6
 */

"use client";

import { useState, useEffect, KeyboardEvent } from "react";
import { validateSkillTag } from "@/src/lib/validators";
import SkillChip from "@/src/components/editor/SkillChip";
import type { PortfolioDTO } from "@/src/types/portfolio";

// Maximum number of skill tags allowed (Requirement 5.3)
const MAX_SKILLS = 30;

interface SkillsFormProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

// Internal type — skill objects include the DB id for API calls
interface SkillItem {
  id: string;
  name: string;
}

export default function SkillsForm({ setPortfolio }: SkillsFormProps) {
  // Skill items with their IDs (used for delete API calls)
  const [skills, setSkills] = useState<SkillItem[]>([]);
  // Text input value
  const [inputValue, setInputValue] = useState("");
  // Error message for the input
  const [inputError, setInputError] = useState<string | null>(null);
  // True while an add or remove request is in flight
  const [isMutating, setIsMutating] = useState(false);

  // ── Load existing skills on mount ─────────────────────────────────────────
  useEffect(() => {
    async function loadSkills() {
      try {
        const res = await fetch("/api/portfolio/skills");
        if (res.ok) {
          const data = await res.json();
          setSkills(data.skills ?? []);
          // Sync name-only array into portfolio state for the preview and save
          syncToPortfolio(data.skills ?? []);
        }
      } catch {
        // Non-fatal — the user can still add new skills
        console.warn("Could not load skills");
      }
    }
    loadSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Push the current skill names into the shared portfolio state. */
  function syncToPortfolio(items: SkillItem[]) {
    setPortfolio((prev) => (prev ? { ...prev, skills: items.map((s) => s.name) } : prev));
  }

  /**
   * Add a skill: validate input, check for duplicates and max limit,
   * then POST to the API and update local state.
   */
  async function handleAdd() {
    const trimmed = inputValue.trim();
    setInputError(null);

    // 1. Validate tag format/length
    const validation = validateSkillTag(trimmed);
    if (!validation.ok) {
      setInputError(validation.error ?? "Invalid skill tag.");
      return;
    }

    // 2. Check for case-insensitive duplicate (Requirement 5.4)
    const isDuplicate = skills.some(
      (s) => s.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setInputError("That skill is already in your list.");
      return;
    }

    // 3. Enforce max tag limit (Requirement 5.3)
    if (skills.length >= MAX_SKILLS) {
      setInputError(`You can add up to ${MAX_SKILLS} skills.`);
      return;
    }

    // 4. POST to API
    setIsMutating(true);
    try {
      const res = await fetch("/api/portfolio/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInputError(data.error ?? "Failed to add skill.");
        return;
      }
      // Add to local state and sync to portfolio
      const updated = [...skills, { id: data.id, name: data.name }];
      setSkills(updated);
      syncToPortfolio(updated);
      setInputValue("");
    } catch {
      setInputError("Network error — could not add skill.");
    } finally {
      setIsMutating(false);
    }
  }

  /**
   * Remove a skill by its ID: call DELETE API then update local state.
   */
  async function handleRemove(id: string) {
    setIsMutating(true);
    try {
      const res = await fetch(`/api/portfolio/skills?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = skills.filter((s) => s.id !== id);
        setSkills(updated);
        syncToPortfolio(updated);
      }
    } catch {
      console.warn("Could not remove skill");
    } finally {
      setIsMutating(false);
    }
  }

  /** Allow pressing Enter to add a skill without clicking the button. */
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <h3 className="text-base font-semibold text-gray-900 mb-1">Skills</h3>
      <div className="border-b border-gray-100 mb-5" />

      {/* Input row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setInputError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. TypeScript"
          maxLength={50}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isMutating || !inputValue.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Add
        </button>
      </div>

      {/* Input error message */}
      {inputError && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {inputError}
        </p>
      )}

      {/* Counter and hint */}
      <p className="mt-1 text-xs text-gray-400">
        {skills.length}/{MAX_SKILLS} skills added
      </p>

      {/* Skill chips */}
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <SkillChip
              key={skill.id}
              name={skill.name}
              onRemove={() => handleRemove(skill.id)}
            />
          ))}
        </div>
      )}

      {skills.length === 0 && (
        <p className="mt-4 text-sm text-gray-400 italic">
          No skills added yet — type a skill above and press Add or Enter.
        </p>
      )}
    </div>
  );
}
