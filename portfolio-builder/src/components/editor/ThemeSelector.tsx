/**
 * ThemeSelector — Renders three ThemeCards side by side in the editor.
 *
 * When the user clicks a ThemeCard, this component updates the portfolio
 * state so both the live preview and the eventual save reflect the choice.
 *
 * Props:
 *   portfolio    — current portfolio state (may be null while loading)
 *   setPortfolio — setter from the parent editor page
 *
 * Styled consistently with the other form sections in the editor.
 */

"use client";

import type { PortfolioDTO } from "@/src/types/portfolio";
import ThemeCard from "@/src/components/editor/ThemeCard";

// The three available theme values
const THEMES: Array<"minimal" | "dark" | "creative"> = [
  "minimal",
  "dark",
  "creative",
];

interface ThemeSelectorProps {
  portfolio: PortfolioDTO | null;
  setPortfolio: React.Dispatch<React.SetStateAction<PortfolioDTO | null>>;
}

export default function ThemeSelector({
  portfolio,
  setPortfolio,
}: ThemeSelectorProps) {
  // The currently active theme — default to "minimal" if portfolio hasn't loaded yet
  const currentTheme = portfolio?.theme ?? "minimal";

  /**
   * When a ThemeCard is clicked, update the portfolio state so:
   *   1. The live preview in PreviewPanel re-renders with the new theme.
   *   2. The next "Save" persists the chosen theme to the database.
   */
  const handleSelect = (selected: "minimal" | "dark" | "creative") => {
    setPortfolio((prev) => {
      if (!prev) return prev;
      return { ...prev, theme: selected };
    });
  };

  return (
    /* Section wrapper — matches the styling of other form sections */
    <div className="space-y-3">
      {/* Section title */}
      <h2 className="text-sm font-semibold text-gray-700">Theme</h2>

      {/* Three ThemeCards arranged horizontally */}
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme}
            theme={theme}
            isSelected={currentTheme === theme}
            onSelect={() => handleSelect(theme)}
          />
        ))}
      </div>
    </div>
  );
}
