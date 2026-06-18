/**
 * PreviewPanel — live preview of the user's portfolio.
 *
 * This component is driven entirely by React state passed as props —
 * it never makes API calls. Whenever the parent updates `portfolio`,
 * this panel re-renders instantly, giving the user real-time feedback.
 *
 * Delegates rendering to one of the three theme components based on
 * portfolio.theme: MinimalTheme, DarkTheme, or CreativeTheme.
 *
 * Props:
 *   portfolio — the full PortfolioDTO from usePortfolio, or null while loading.
 *
 * Sections rendered (when data is present):
 *   1. Name / Professional Title
 *   2. Bio
 *   3. Skills
 *   4. Work Experience
 *   5. Projects
 *   6. Education
 *   7. Social Links
 */

import type { PortfolioDTO } from "@/src/types/portfolio";
import MinimalTheme from "@/src/components/themes/MinimalTheme";
import DarkTheme from "@/src/components/themes/DarkTheme";
import CreativeTheme from "@/src/components/themes/CreativeTheme";

interface PreviewPanelProps {
  portfolio: PortfolioDTO | null;
}

export default function PreviewPanel({ portfolio }: PreviewPanelProps) {
  // ── Empty state ────────────────────────────────────────────────────────────
  if (!portfolio) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
        <p className="text-center text-sm text-gray-400">
          Your portfolio preview will appear here
        </p>
      </div>
    );
  }

  // Determine whether any data has been entered at all.
  const hasName = Boolean(portfolio.name);
  const hasTitle = Boolean(portfolio.title);
  const hasBio = Boolean(portfolio.bio);
  const hasSkills = portfolio.skills.length > 0;
  const hasExperiences = portfolio.experiences.length > 0;
  const hasProjects = portfolio.projects.length > 0;
  const hasEducations = portfolio.educations.length > 0;
  const hasSocialLinks = portfolio.socialLinks.length > 0;

  const hasAnyData =
    hasName || hasTitle || hasBio || hasSkills ||
    hasExperiences || hasProjects || hasEducations || hasSocialLinks;

  if (!hasAnyData) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8">
        <p className="text-center text-sm text-gray-400">
          Your portfolio preview will appear here
        </p>
      </div>
    );
  }

  // ── Theme routing ──────────────────────────────────────────────────────────
  //
  // Wrap the chosen theme in a scrollable framed container so it fits nicely
  // inside the split-screen editor without taking up the full viewport.
  const theme = portfolio.theme ?? "minimal";

  const ThemeComponent =
    theme === "dark"
      ? DarkTheme
      : theme === "creative"
      ? CreativeTheme
      : MinimalTheme;

  return (
    <div className="h-full overflow-y-auto rounded-lg border border-gray-200 shadow-sm">
      <ThemeComponent portfolio={portfolio} />
    </div>
  );
}
