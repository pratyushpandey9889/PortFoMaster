/**
 * ThemeCard — A selectable thumbnail representing one visual theme.
 *
 * Displays the theme name and a small color swatch so the user can
 * visually differentiate between the three themes before selecting one.
 *
 * Props:
 *   theme      — which theme this card represents ("minimal" | "dark" | "creative")
 *   isSelected — whether this theme is currently active
 *   onSelect   — called when the user clicks the card
 *
 * Selected state: indigo ring border so it's clearly highlighted.
 */

// Theme names and their preview colors / descriptions
const THEME_META: Record<
  "minimal" | "dark" | "creative",
  { label: string; swatchColors: string[]; description: string }
> = {
  minimal: {
    label: "Minimal",
    // Light gray + dark text swatch
    swatchColors: ["bg-white border border-gray-200", "bg-gray-100", "bg-gray-300"],
    description: "Clean & whitespace-heavy",
  },
  dark: {
    label: "Dark",
    // Dark gray + indigo accent swatch
    swatchColors: ["bg-gray-900", "bg-indigo-900", "bg-indigo-700"],
    description: "Sleek dark mode",
  },
  creative: {
    label: "Creative",
    // Gradient indigo-to-purple swatch
    swatchColors: ["bg-indigo-600", "bg-purple-500", "bg-indigo-400"],
    description: "Bold & colorful",
  },
};

interface ThemeCardProps {
  theme: "minimal" | "dark" | "creative";
  isSelected: boolean;
  onSelect: () => void;
}

export default function ThemeCard({ theme, isSelected, onSelect }: ThemeCardProps) {
  const meta = THEME_META[theme];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        // Base card styles
        "flex flex-col items-center gap-2 rounded-lg border-2 p-3 w-full transition-all",
        // Selected: indigo ring; unselected: gray border
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50"
          : "border-gray-200 hover:border-indigo-300 bg-white",
      ].join(" ")}
      aria-pressed={isSelected}
      aria-label={`Select ${meta.label} theme`}
    >
      {/* Color swatch preview — three small squares showing the theme palette */}
      <div className="flex gap-1">
        {meta.swatchColors.map((colorClass, i) => (
          <div
            key={i}
            className={`h-6 w-6 rounded ${colorClass}`}
          />
        ))}
      </div>

      {/* Theme name */}
      <span
        className={`text-sm font-semibold ${
          isSelected ? "text-indigo-700" : "text-gray-700"
        }`}
      >
        {meta.label}
      </span>

      {/* Short description */}
      <span className="text-xs text-gray-400 text-center leading-tight">
        {meta.description}
      </span>
    </button>
  );
}
