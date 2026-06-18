/**
 * ProjectsForm — add, edit, and remove project entries.
 *
 * Features:
 *  - "Add Project" button (max 20 entries)
 *  - Each entry card: title, description, technologies (comma-separated chips),
 *    GitHub URL, live demo URL
 *  - URL fields validated with validateHttpsUrl on blur; field-level errors shown
 *  - Technologies: user types comma-separated tags, shown as chips; max 15 items
 *  - Immediate DELETE API call on remove
 *  - Debounced PUT on field change (1 s)
 *  - On mount: loads existing entries from GET /api/portfolio/projects
 *
 * Requirements: 7.1–7.7
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { validateHttpsUrl } from "@/src/lib/validators";
import type { PortfolioDTO, ProjectDTO } from "@/src/types/portfolio";

// Maximum allowed project entries (Requirement 7.3)
const MAX_PROJECTS = 20;

// Max characters in description (Requirement 7.7)
const MAX_DESC = 500;

// Max tech items (Requirement 7.1 / spec note)
const MAX_TECH = 15;

interface ProjectsFormProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

// Internal shape: we store techInput as a comma-separated string for the text input
interface ProjectItem extends ProjectDTO {
  // These are additional UI-only fields used during editing
  githubError?: string;
  liveError?: string;
  techInput?: string; // Raw comma-separated string from the text input
}

export default function ProjectsForm({ setPortfolio }: ProjectsFormProps) {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/portfolio/projects");
        if (res.ok) {
          const data = await res.json();
          // Initialise techInput from the techList array
          const items: ProjectItem[] = (data.projects ?? []).map(
            (p: ProjectDTO) => ({
              ...p,
              techInput: p.techList.join(", "),
            })
          );
          setProjects(items);
          syncToPortfolio(items);
        }
      } catch {
        console.warn("Could not load projects");
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Push the current list (without UI-only fields) to shared portfolio state. */
  function syncToPortfolio(items: ProjectItem[]) {
    setPortfolio((prev) =>
      prev
        ? {
            ...prev,
            projects: items.map(({ githubError: _g, liveError: _l, techInput: _t, ...rest }) => rest as ProjectDTO),
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

  /** Add a blank project entry. */
  async function handleAdd() {
    setLimitError(null);
    if (projects.length >= MAX_PROJECTS) {
      setLimitError(`You can add up to ${MAX_PROJECTS} projects.`);
      return;
    }
    setIsAdding(true);
    try {
      const res = await fetch("/api/portfolio/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "",
          description: "",
          techList: [],
          githubUrl: null,
          liveUrl: null,
        }),
      });
      if (res.ok) {
        const newProject: ProjectDTO = await res.json();
        const item: ProjectItem = { ...newProject, techInput: "" };
        const updated = [...projects, item];
        setProjects(updated);
        syncToPortfolio(updated);
        setExpandedIds((prev) => new Set(prev).add(newProject.id));
      }
    } catch {
      console.warn("Could not add project");
    } finally {
      setIsAdding(false);
    }
  }

  /** Delete a project immediately. */
  async function handleDelete(id: string) {
    try {
      await fetch(`/api/portfolio/projects?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      console.warn("Could not delete project");
    }
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    syncToPortfolio(updated);
    const timer = saveTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(id);
    }
  }

  /**
   * Update a field on a project entry and schedule a debounced save.
   */
  function handleFieldChange(
    id: string,
    field: keyof ProjectItem,
    value: string | string[] | null
  ) {
    const updated = projects.map((p) => {
      if (p.id !== id) return p;
      const next = { ...p, [field]: value };
      // Clear errors when the user edits a URL field
      if (field === "githubUrl") next.githubError = undefined;
      if (field === "liveUrl") next.liveError = undefined;
      return next;
    });
    setProjects(updated);
    syncToPortfolio(updated);
    scheduleSave(id, updated);
  }

  /**
   * Handle the tech input field specially — parse comma-separated tags.
   * Enforces max 15 items, each max 50 chars.
   */
  function handleTechInputChange(id: string, raw: string) {
    // Parse the comma-separated string into an array
    const tags = raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, MAX_TECH)
      .map((t) => t.slice(0, 50));

    const updated = projects.map((p) => {
      if (p.id !== id) return p;
      return { ...p, techInput: raw, techList: tags };
    });
    setProjects(updated);
    syncToPortfolio(updated);
    scheduleSave(id, updated);
  }

  /** Validate a URL field on blur and set a field-level error if invalid. */
  function handleUrlBlur(id: string, field: "githubUrl" | "liveUrl") {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const url = p[field] ?? "";
        const result = validateHttpsUrl(url);
        if (!result.ok) {
          return {
            ...p,
            ...(field === "githubUrl"
              ? { githubError: result.error }
              : { liveError: result.error }),
          };
        }
        return p;
      })
    );
  }

  /** Schedule a debounced PUT call for the given project id. */
  function scheduleSave(id: string, items: ProjectItem[]) {
    const existing = saveTimers.current.get(id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      const entry = items.find((p) => p.id === id);
      if (!entry) return;
      try {
        await fetch(`/api/portfolio/projects/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: entry.title,
            description: entry.description,
            techList: entry.techList,
            githubUrl: entry.githubUrl || null,
            liveUrl: entry.liveUrl || null,
          }),
        });
      } catch {
        console.warn("Could not save project");
      }
    }, 1000);

    saveTimers.current.set(id, timer);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Projects</h3>
        <button
          type="button"
          onClick={handleAdd}
          disabled={isAdding}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isAdding ? "Adding…" : "+ Add Project"}
        </button>
      </div>
      <div className="border-b border-gray-100 mb-5" />

      {limitError && (
        <p role="alert" className="mb-4 text-xs text-red-600">
          {limitError}
        </p>
      )}

      {projects.length === 0 && (
        <p className="text-sm text-gray-400 italic">
          No projects added yet — click "Add Project" to showcase your work.
        </p>
      )}

      <div className="space-y-4">
        {projects.map((proj, index) => {
          const isExpanded = expandedIds.has(proj.id);
          const summaryText = proj.title || `Project ${index + 1}`;

          return (
            <div
              key={proj.id}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* Card header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none">
                <button
                  type="button"
                  onClick={() => toggleExpand(proj.id)}
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
                  onClick={() => handleDelete(proj.id)}
                  className="ml-2 text-xs text-red-500 hover:text-red-700 transition"
                  aria-label={`Delete ${summaryText}`}
                >
                  Delete
                </button>
              </div>

              {/* Expandable fields */}
              {isExpanded && (
                <div className="px-4 py-4 space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={100}
                      value={proj.title}
                      onChange={(e) =>
                        handleFieldChange(proj.id, "title", e.target.value)
                      }
                      placeholder="e.g. Portfolio Website Builder"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p className="mt-0.5 text-xs text-gray-400 text-right">
                      {proj.title.length}/100
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      maxLength={MAX_DESC}
                      value={proj.description}
                      onChange={(e) =>
                        handleFieldChange(proj.id, "description", e.target.value)
                      }
                      placeholder="Describe what this project does…"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none resize-y focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    <p
                      className={`mt-0.5 text-xs text-right ${
                        proj.description.length >= MAX_DESC
                          ? "text-red-500 font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {proj.description.length}/{MAX_DESC}
                    </p>
                  </div>

                  {/* Technologies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technologies
                      <span className="ml-1 text-xs text-gray-400 font-normal">
                        (comma-separated, max {MAX_TECH})
                      </span>
                    </label>
                    <input
                      type="text"
                      value={proj.techInput ?? proj.techList.join(", ")}
                      onChange={(e) =>
                        handleTechInputChange(proj.id, e.target.value)
                      }
                      placeholder="e.g. React, TypeScript, Tailwind CSS"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    />
                    {/* Show parsed tags as chips */}
                    {proj.techList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {proj.techList.map((tag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {proj.techList.length}/{MAX_TECH} technologies
                    </p>
                  </div>

                  {/* GitHub URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub URL
                    </label>
                    <input
                      type="text"
                      value={proj.githubUrl ?? ""}
                      onChange={(e) =>
                        handleFieldChange(proj.id, "githubUrl", e.target.value || null)
                      }
                      onBlur={() => handleUrlBlur(proj.id, "githubUrl")}
                      placeholder="https://github.com/user/project"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition ${
                        proj.githubError
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {proj.githubError && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {proj.githubError}
                      </p>
                    )}
                  </div>

                  {/* Live Demo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Live Demo URL
                    </label>
                    <input
                      type="text"
                      value={proj.liveUrl ?? ""}
                      onChange={(e) =>
                        handleFieldChange(proj.id, "liveUrl", e.target.value || null)
                      }
                      onBlur={() => handleUrlBlur(proj.id, "liveUrl")}
                      placeholder="https://your-project.vercel.app"
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 transition ${
                        proj.liveError
                          ? "border-red-400 focus:ring-red-400"
                          : "border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                      }`}
                    />
                    {proj.liveError && (
                      <p role="alert" className="mt-1 text-xs text-red-600">
                        {proj.liveError}
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
