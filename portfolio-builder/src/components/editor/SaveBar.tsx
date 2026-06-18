/**
 * SaveBar — sticky top bar displayed in the editor.
 *
 * Shows:
 *   - "Save" button: calls `onSave()` and displays "Saving..." while in progress.
 *   - "Your public URL:" label with the user's portfolio link (/p/{username}).
 *   - "Copy Link" button: copies the URL to the clipboard and shows "Copied!"
 *     for 2 seconds as confirmation.
 *
 * Props:
 *   username  — the user's unique username (used to build the public URL)
 *   isSaving  — whether a save is currently in flight (controls button state)
 *   onSave    — callback to trigger a manual save
 */

"use client";

import { useState } from "react";

interface SaveBarProps {
  username: string;
  isSaving: boolean;
  onSave: () => void;
}

export default function SaveBar({ username, isSaving, onSave }: SaveBarProps) {
  // Controls the "Copied!" confirmation flash on the Copy Link button.
  const [copied, setCopied] = useState(false);

  // Build the full public URL — we use the window.location.origin so it works
  // on any host (local dev, staging, production) without hard-coding a domain.
  const publicPath = `/p/${username}`;
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${publicPath}`
      : publicPath;

  /**
   * Copy the public URL to the clipboard, then show a "Copied!" confirmation
   * that resets back to "Copy Link" after 2 seconds.
   */
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be blocked (e.g., non-HTTPS in some browsers).
      // Silently ignore — the user still sees the URL and can copy it manually.
    }
  }

  return (
    /*
     * Sticky bar pinned to the top of the viewport.
     * z-10 ensures it sits above the scrollable content below.
     */
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white px-6 py-3 shadow-sm border-b border-gray-200">
      {/* ── Left: Public URL display ─────────────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-sm text-gray-500 whitespace-nowrap">
          Your public URL:
        </span>
        {/* Truncate long URLs on narrow screens */}
        <a
          href={publicPath}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800 truncate max-w-xs"
          title={publicUrl}
        >
          {publicUrl}
        </a>
      </div>

      {/* ── Right: Action buttons ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Copy Link button */}
        <button
          onClick={handleCopyLink}
          className="text-sm px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors"
          type="button"
        >
          {copied ? "Copied!" : "Copy Link"}
        </button>

        {/* Save button — disabled while saving to prevent duplicate requests */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="text-sm px-4 py-1.5 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          type="button"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
