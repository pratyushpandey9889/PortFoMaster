/**
 * /editor — The main portfolio editor page.
 *
 * This is a Client Component (auth is enforced by middleware — see middleware.ts).
 * It orchestrates the entire editor experience:
 *
 *   1. Loads portfolio data on mount via the usePortfolio() hook.
 *   2. Gets the current user's username from the NextAuth session.
 *   3. Renders the SaveBar (top sticky bar) with save state and public URL.
 *   4. Renders EditorLayout with:
 *        Left side  — all form sections (Tasks 5–11)
 *        Right side — PreviewPanel driven by live React state
 *
 * The portfolio state flows down from this page to child components.
 * When the user edits a field, they call setPortfolio() which triggers
 * both the live preview update and the auto-save debounce timer.
 */

"use client";

import { useSession } from "next-auth/react";
import { usePortfolio } from "@/src/hooks/usePortfolio";
import EditorLayout from "@/src/components/editor/EditorLayout";
import PreviewPanel from "@/src/components/editor/PreviewPanel";
import SaveBar from "@/src/components/editor/SaveBar";

// ── Form sections (Tasks 5–11) ─────────────────────────────────────────────
import PersonalInfoForm from "@/src/components/editor/PersonalInfoForm";
import PhotoUpload from "@/src/components/editor/PhotoUpload";
import BioForm from "@/src/components/editor/BioForm";
import SkillsForm from "@/src/components/editor/SkillsForm";
import ExperienceForm from "@/src/components/editor/ExperienceForm";
import ProjectsForm from "@/src/components/editor/ProjectsForm";
import EducationForm from "@/src/components/editor/EducationForm";
import SocialLinksForm from "@/src/components/editor/SocialLinksForm";

import Notification from "@/src/components/ui/Notification";

// ── Task 12: Theme selector ────────────────────────────────────────────────
import ThemeSelector from "@/src/components/editor/ThemeSelector";

export default function EditorPage() {
  // ── Auth: get the logged-in user's username ────────────────────────────────
  // The session is populated by auth.config.ts which injects `username` from the JWT.
  const { data: session } = useSession();
  // Cast because username is added in the jwt/session callbacks in auth.config.ts
  const username = (session?.user as { username?: string } | undefined)?.username ?? "";

  // ── Portfolio state and actions ────────────────────────────────────────────
  const { portfolio, setPortfolio, isSaving, isLoading, error, save, saveSuccess } = usePortfolio();

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Simple spinner using an animated border */}
          <div className="mx-auto h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">Loading your portfolio…</p>
        </div>
      </div>
    );
  }

  // ── Error state (load failed) ──────────────────────────────────────────────
  if (error && !portfolio) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm mx-auto px-4">
          <p className="text-sm font-semibold text-red-600">
            Could not load your portfolio
          </p>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-sm text-indigo-600 underline hover:text-indigo-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Main editor shell ──────────────────────────────────────────────────────
  return (
    /*
     * Full-viewport flex column:
     *   - SaveBar is pinned at the top (it is sticky internally).
     *   - EditorLayout takes all remaining height (flex-1).
     */
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ── Sticky top bar: save button + public URL ───────────────────── */}
      {username && (
        <SaveBar
          username={username}
          isSaving={isSaving}
          onSave={save}
        />
      )}

      {/* ── Save error banner (shown after a failed manual save) ────────── */}
      {error && portfolio && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2">
          <p className="text-xs text-red-600">
            Save failed: {error} — your changes are still here, try saving again.
          </p>
        </div>
      )}

      {/* Success notification after save */}
      {saveSuccess && (
        <Notification
          message="Portfolio saved!"
          type="success"
          onDismiss={() => {}}
        />
      )}

      {/* ── Split-screen editor ────────────────────────────────────────── */}
      <EditorLayout
        formPanel={
          /*
           * ── Form Panel (left side) ─────────────────────────────────────────
           *
           * Scrollable container stacking all form sections vertically.
           * Each section calls setPortfolio() to update shared state,
           * which triggers both the live preview and the auto-save timer.
           */
          <div className="p-6 space-y-8 overflow-y-auto h-full">
            {/* Task 5: Personal info + photo upload */}
            <PersonalInfoForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />
            <PhotoUpload
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 6: Bio + AI generation */}
            <BioForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 12: Theme selection */}
            <ThemeSelector
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 7: Skills */}
            <SkillsForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 8: Work experience */}
            <ExperienceForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 9: Projects */}
            <ProjectsForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 10: Education */}
            <EducationForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />

            {/* Task 11: Social links */}
            <SocialLinksForm
              portfolio={portfolio}
              setPortfolio={setPortfolio}
            />
          </div>
        }
        previewPanel={
          /*
           * ── Preview Panel (right side) ─────────────────────────────────────
           *
           * PreviewPanel reads directly from portfolio state — no API calls.
           * Every time the user changes a field (via setPortfolio), this re-renders
           * immediately, giving live preview within React's render cycle (~0 ms).
           */
          <PreviewPanel portfolio={portfolio} />
        }
      />
    </div>
  );
}
