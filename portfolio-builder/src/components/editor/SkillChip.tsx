/**
 * SkillChip — displays a single skill tag with a remove button.
 *
 * Used by SkillsForm to render each skill in the list.
 * Clicking the × button calls the onRemove callback.
 *
 * Requirement 5.2
 */

"use client";

interface SkillChipProps {
  /** The skill name to display inside the chip */
  name: string;
  /** Called when the user clicks the × button */
  onRemove: () => void;
}

export default function SkillChip({ name, onRemove }: SkillChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1 text-sm text-indigo-700">
      {/* Skill label */}
      <span>{name}</span>

      {/* Remove (×) button — min 44×44 px touch target for mobile accessibility (Requirement 16.3) */}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove skill ${name}`}
        className="ml-1 flex items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-700 transition p-2 -m-2"
      >
        {/* × character */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </span>
  );
}
