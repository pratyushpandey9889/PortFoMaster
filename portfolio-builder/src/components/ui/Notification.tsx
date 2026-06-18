"use client";
/**
 * Notification — auto-dismissing toast notification.
 *
 * Shown in the bottom-right corner of the screen.
 * Auto-dismisses after 4 seconds (Requirement 12.3 — success notification).
 *
 * Props:
 *   message   — the text to display
 *   type      — "success" (green) or "error" (red)
 *   onDismiss — called when dismissed (manually or automatically)
 */
import { useEffect } from "react";

interface NotificationProps {
  message: string;
  type: "success" | "error";
  onDismiss: () => void;
}

export default function Notification({ message, type, onDismiss }: NotificationProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="alert"
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-sm font-medium max-w-sm ${
        type === "success"
          ? "bg-green-50 border border-green-200 text-green-800"
          : "bg-red-50 border border-red-200 text-red-800"
      }`}
    >
      <span aria-hidden="true">{type === "success" ? "✓" : "✕"}</span>
      <span>{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-auto opacity-60 hover:opacity-100 text-lg leading-none"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
