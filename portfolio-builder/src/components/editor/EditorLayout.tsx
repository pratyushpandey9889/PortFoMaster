/**
 * EditorLayout — responsive split-screen wrapper for the editor.
 *
 * Layout behaviour:
 *   - On screens WIDER than 1024 px (lg breakpoint and above):
 *       Two equal columns side-by-side using CSS Grid (grid-cols-2).
 *       The form panel is on the left; the preview panel is on the right.
 *   - On screens 1024 px OR NARROWER:
 *       Both panels are stacked vertically.
 *       A toggle button ("Form" / "Preview") lets the user switch between views.
 *       Only the active panel is visible; the inactive one is hidden.
 *
 * Props:
 *   formPanel    — the JSX to render on the left (form sections)
 *   previewPanel — the JSX to render on the right (live preview)
 */

"use client";

import { useState } from "react";

type ActiveView = "form" | "preview";

interface EditorLayoutProps {
  formPanel: React.ReactNode;
  previewPanel: React.ReactNode;
}

export default function EditorLayout({
  formPanel,
  previewPanel,
}: EditorLayoutProps) {
  // Controls which panel is visible on narrow screens.
  const [activeView, setActiveView] = useState<ActiveView>("form");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/*
       * ── Mobile / Tablet toggle bar ─────────────────────────────────────────
       * Only rendered below the lg (1024 px) breakpoint.
       * "lg:hidden" hides it on wide screens.
       */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setActiveView("form")}
          className={[
            "flex-1 py-2.5 text-sm font-medium transition-colors",
            activeView === "form"
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          Form
        </button>
        <button
          type="button"
          onClick={() => setActiveView("preview")}
          className={[
            "flex-1 py-2.5 text-sm font-medium transition-colors",
            activeView === "preview"
              ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
              : "text-gray-500 hover:text-gray-700",
          ].join(" ")}
        >
          Preview
        </button>
      </div>

      {/*
       * ── Main content area ──────────────────────────────────────────────────
       *
       * Wide screens (≥ 1024 px):
       *   grid grid-cols-2 — side-by-side 50/50 split.
       *
       * Narrow screens (< 1024 px):
       *   block — panels stack; toggle buttons above control visibility.
       */}
      <div className="flex-1 min-h-0 lg:grid lg:grid-cols-2 lg:gap-0">
        {/*
         * ── Left panel: Form ─────────────────────────────────────────────────
         *
         * On wide screens: always visible (display:block from the grid).
         * On narrow screens: show only when activeView === "form".
         *   - "block" / "hidden" switch via conditional class.
         *   - "lg:block" ensures it's always shown on wide screens regardless
         *     of the activeView state.
         */}
        <div
          className={[
            "h-full overflow-y-auto border-r border-gray-200 bg-white",
            "lg:block", // always visible on wide screens
            activeView === "form" ? "block" : "hidden", // toggle on narrow screens
          ].join(" ")}
        >
          {formPanel}
        </div>

        {/*
         * ── Right panel: Preview ─────────────────────────────────────────────
         *
         * Same visibility logic as the form panel, but inverted.
         */}
        <div
          className={[
            "h-full overflow-y-auto bg-gray-50 p-4",
            "lg:block", // always visible on wide screens
            activeView === "preview" ? "block" : "hidden", // toggle on narrow screens
          ].join(" ")}
        >
          {previewPanel}
        </div>
      </div>
    </div>
  );
}
