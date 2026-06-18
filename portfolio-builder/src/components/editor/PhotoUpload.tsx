/**
 * PhotoUpload — profile photo upload with drag-and-drop support.
 *
 * Features:
 *  - Drag-and-drop zone OR click-to-browse file picker
 *  - Client-side validation via validatePhotoFile (type + size)
 *  - Shows a preview of the selected image before / after upload
 *  - Uploads to POST /api/portfolio/photo
 *  - Updates portfolio.photoUrl via setPortfolio on success
 *  - Shows a loading spinner during upload
 *  - Shows descriptive error messages (type violation vs size violation)
 *
 * Accepted formats: JPEG, PNG, WebP  (Requirement 3.2)
 * Max file size   : 5 MB             (Requirement 3.2)
 */

"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import Image from "next/image";
import { validatePhotoFile } from "@/src/lib/validators";
import type { PortfolioDTO } from "@/src/types/portfolio";

interface PhotoUploadProps {
  /** The current portfolio state — used to read the existing photoUrl. */
  portfolio: PortfolioDTO | null;
  /** Callback to update the portfolio state after a successful upload. */
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

export default function PhotoUpload({
  portfolio,
  setPortfolio,
}: PhotoUploadProps) {
  // ── Local state ────────────────────────────────────────────────────────────
  /** Blob URL for the local preview (set immediately after file selection) */
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  /** Error message shown below the drop zone */
  const [error, setError] = useState<string | null>(null);
  /** True while the POST /api/portfolio/photo request is in flight */
  const [isUploading, setIsUploading] = useState(false);
  /** Whether the user is currently hovering a file over the drop zone */
  const [isDragging, setIsDragging] = useState(false);

  // Hidden file input element — the drop zone click delegates to this
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helper: validate and process a File object ─────────────────────────────
  async function processFile(file: File) {
    setError(null);

    // Client-side validation (mirrors server-side check)
    const validation = validatePhotoFile(file.type, file.size);
    if (!validation.ok) {
      setError(validation.error ?? "Invalid file.");
      setPreviewUrl(null);
      return;
    }

    // Show a local preview immediately (before upload completes)
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    // ── Upload to server ────────────────────────────────────────────────────
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await fetch("/api/portfolio/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        // Server-side validation may have a more specific message
        setError(data.error ?? "Upload failed. Please try again.");
        // Keep the preview so the user can see what they chose
        return;
      }

      // Update portfolio state with the server's canonical URL
      setPortfolio((prev) =>
        prev ? { ...prev, photoUrl: data.photoUrl } : prev
      );
    } catch {
      setError("Upload failed — please check your connection and try again.");
    } finally {
      setIsUploading(false);
    }
  }

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    // Prevent browser default (which would open the file)
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  // ── File input change handler (click-to-browse) ───────────────────────────

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input value so the same file can be re-selected if needed
    e.target.value = "";
  }

  // ── Compute the displayed image URL ───────────────────────────────────────
  // Prefer the local preview while uploading; fall back to the saved server URL
  const displayUrl = previewUrl ?? portfolio?.photoUrl ?? null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Section heading */}
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Profile Photo
      </h2>
      <p className="text-xs text-gray-500 mb-5">
        JPEG, PNG, or WebP · max 5 MB
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        {/* ── Drop zone / click target ─────────────────────────────────── */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload profile photo"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center
            w-40 h-40 rounded-xl border-2 border-dashed cursor-pointer
            transition-colors text-center
            ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
            }
          `}
        >
          {/* Show preview image if available */}
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Profile photo preview"
              fill
              className="object-cover rounded-xl"
              // Use unoptimized for blob: URLs (local preview); optimise server URLs
              unoptimized={!!previewUrl}
            />
          ) : (
            // Placeholder icon + instruction text
            <div className="flex flex-col items-center gap-2 px-3">
              {/* Camera icon (inline SVG — no extra dependency) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.172a2 2 0 001.414-.586l.828-.828A2 2 0 018.828 5h6.344a2 2 0 011.414.586l.828.828A2 2 0 0019.828 7H20a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-xs text-gray-400 leading-snug">
                Drag &amp; drop or click to browse
              </span>
            </div>
          )}

          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl">
              <div className="h-8 w-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            </div>
          )}
        </div>

        {/* ── Hidden file input ─────────────────────────────────────────── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-hidden="true"
          onChange={handleFileChange}
        />

        {/* ── Right-hand info / error ───────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {error ? (
            <p
              role="alert"
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          ) : (
            <p className="text-xs text-gray-500 leading-relaxed">
              A square photo works best. Your photo will appear at the top of
              your portfolio page.
            </p>
          )}

          {/* "Change photo" button shown after a photo is selected */}
          {displayUrl && !isUploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
            >
              Change photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
