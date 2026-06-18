/**
 * usePortfolio — custom hook for loading, editing, and saving a user's portfolio.
 *
 * Responsibilities:
 *   1. Load the portfolio from the server on mount (GET /api/portfolio).
 *   2. Expose the current portfolio state and a setter so components can update it.
 *   3. Provide a manual `save()` function that PUTs state to the server and sets
 *      `isSaving` while the request is in flight.
 *   4. Auto-save: whenever `portfolio` state changes, schedule a debounced save
 *      that fires at most once every 30 seconds. Auto-save does NOT set `isSaving`
 *      so the UI stays quiet during background saves.
 *
 * Auto-save debounce pattern:
 *   - A ref holds the current timeout handle.
 *   - Every time `portfolio` changes, we clear the old timeout and schedule a new
 *     one 30 000 ms in the future.
 *   - This means the save only fires after 30 s of the *last* change, which is the
 *     correct UX behaviour.
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { PortfolioDTO } from "@/src/types/portfolio";

// How long (ms) to wait after the last change before auto-saving.
const AUTO_SAVE_DELAY_MS = 30_000;

// ── Return type exposed to consumers ──────────────────────────────────────────

export interface UsePortfolioResult {
  /** The current portfolio data (null while loading) */
  portfolio: PortfolioDTO | null;
  /** Setter — call this when the user edits any field */
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
  /** Manually trigger a save; sets isSaving while in flight */
  save: () => Promise<void>;
  /** True while a manual save request is in flight */
  isSaving: boolean;
  /** True while the initial GET /api/portfolio is in flight */
  isLoading: boolean;
  /** Non-null when the latest load or save produced an error */
  error: string | null;
  /** True for 4 s after a successful manual save (drives success notification) */
  saveSuccess: boolean;
}

// ── Hook implementation ────────────────────────────────────────────────────────

export function usePortfolio(): UsePortfolioResult {
  const [portfolio, setPortfolio] = useState<PortfolioDTO | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Ref to hold the debounce timer handle so we can clear/reset it on each change.
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to hold the latest portfolio value so the auto-save closure always
  // reads the newest state without re-creating the effect on every render.
  const portfolioRef = useRef<PortfolioDTO | null>(null);
  portfolioRef.current = portfolio;

  // ── Load portfolio on mount ──────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false; // guard against setting state after unmount

    async function loadPortfolio() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/portfolio");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Server error ${res.status}`);
        }
        const data: PortfolioDTO = await res.json();
        if (!cancelled) setPortfolio(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load portfolio.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadPortfolio();
    return () => {
      cancelled = true;
    };
  }, []); // runs once on mount

  // ── Core save function (shared by manual and auto-save) ─────────────────────

  /**
   * Sends the current portfolio state to PUT /api/portfolio.
   * `showSavingIndicator` controls whether `isSaving` is toggled (manual save only).
   */
  const performSave = useCallback(
    async (showSavingIndicator: boolean) => {
      const current = portfolioRef.current;
      if (!current) return; // nothing to save yet

      if (showSavingIndicator) setIsSaving(true);
      setError(null);

      try {
        const res = await fetch("/api/portfolio", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(current),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Server error ${res.status}`);
        }
        if (showSavingIndicator) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 4000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save portfolio.");
      } finally {
        if (showSavingIndicator) setIsSaving(false);
      }
    },
    [] // stable — reads via ref
  );

  // ── Manual save (exposed to UI) ──────────────────────────────────────────────

  const save = useCallback(async () => {
    // Cancel any pending auto-save — the manual save takes its place.
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = null;
    }
    await performSave(true); // show isSaving indicator
  }, [performSave]);

  // ── Auto-save on portfolio change ────────────────────────────────────────────
  //
  // Runs every time `portfolio` updates (i.e., after every field edit).
  // We skip the very first render where portfolio is still null (nothing loaded yet).

  useEffect(() => {
    // Don't schedule an auto-save before the initial load completes.
    if (portfolio === null) return;

    // Clear any previously scheduled auto-save and start a fresh 30 s countdown.
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(() => {
      // Auto-save fires silently (no isSaving indicator)
      performSave(false);
    }, AUTO_SAVE_DELAY_MS);

    // Cleanup: if the component unmounts or portfolio changes again before the
    // timer fires, cancel the scheduled save.
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, [portfolio, performSave]);

  return { portfolio, setPortfolio, save, isSaving, isLoading, error, saveSuccess };
}
