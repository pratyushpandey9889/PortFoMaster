/**
 * Public Portfolio Page — /p/[username]
 *
 * This is a Server Component (no "use client" directive).
 * It is accessible to all visitors without authentication (Requirement 14.5).
 *
 * Flow:
 *   1. Read the username from route params (awaited — Next.js 16 params are a Promise).
 *   2. Query the database for the user and their portfolio.
 *   3. If not found, call notFound() to show the 404 page.
 *   4. Map the database record to a PortfolioDTO.
 *   5. Render the correct theme component based on portfolio.theme.
 *
 * SEO: generateMetadata() produces <title>, <meta description>, and Open Graph
 *      tags from the user's name and bio (Requirement 14.6).
 */

import { notFound } from "next/navigation";
import { prisma } from "@/src/lib/prisma";
import type { Metadata } from "next";

// The three theme components — each accepts a PortfolioDTO and renders the full portfolio
import MinimalTheme from "@/src/components/themes/MinimalTheme";
import DarkTheme from "@/src/components/themes/DarkTheme";
import CreativeTheme from "@/src/components/themes/CreativeTheme";

// Shared DTO types used throughout the app
import type { PortfolioDTO, SocialLinkDTO } from "@/src/types/portfolio";

// ── Type helpers ──────────────────────────────────────────────────────────────

// Valid theme values — used to cast the DB string to the DTO union type
const VALID_THEMES = ["minimal", "dark", "creative"] as const;
type ValidTheme = (typeof VALID_THEMES)[number];

// Params type — Next.js 16 passes params as a Promise
interface PageProps {
  params: Promise<{ username: string }>;
}

// ── generateMetadata ─────────────────────────────────────────────────────────
//
// Called by Next.js at build/request time to populate <head> tags.
// Returns title, description, and Open Graph data for social media previews.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // Await params — required in Next.js 16 App Router
  const { username } = await params;

  // Minimal query: only fetch what we need for the metadata
  const user = await prisma.user.findUnique({
    where: { username },
    include: { portfolio: true },
  });

  // Fallback if the user or portfolio doesn't exist
  if (!user?.portfolio) {
    return { title: "Portfolio not found" };
  }

  const portfolio = user.portfolio;

  // Bio truncated to 160 chars for the meta description (standard max length)
  const description = portfolio.bio?.slice(0, 160) ?? "";

  return {
    title: `${portfolio.name} – Portfolio`,
    description,
    openGraph: {
      title: `${portfolio.name} – Portfolio`,
      description,
      url: `/p/${username}`,
    },
  };
}

// ── Page Component ───────────────────────────────────────────────────────────

export default async function PublicPortfolioPage({ params }: PageProps) {
  // 1. Get the username from params (awaited — Next.js 16 style)
  const { username } = await params;

  // 2. Query the database — include all related portfolio data
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      portfolio: {
        include: {
          skills: true,       // Skill[]
          experiences: true,  // WorkExperience[]
          projects: true,     // Project[]
          educations: true,   // Education[]
          socialLinks: true,  // SocialLink[]
        },
      },
    },
  });

  // 3. If the user or portfolio doesn't exist, render the 404 page
  if (!user?.portfolio) {
    notFound();
  }

  const dbPortfolio = user.portfolio;

  // 4. Map the database record to the PortfolioDTO shape
  //    (same mapping logic as in GET /api/portfolio)
  const portfolio: PortfolioDTO = {
    name: dbPortfolio.name,
    title: dbPortfolio.title,
    location: dbPortfolio.location,
    bio: dbPortfolio.bio,

    // Cast the DB string to the DTO union — default to "minimal" for safety
    theme: VALID_THEMES.includes(dbPortfolio.theme as ValidTheme)
      ? (dbPortfolio.theme as ValidTheme)
      : "minimal",

    photoUrl: dbPortfolio.photoUrl,

    // Skills: array of name strings
    skills: dbPortfolio.skills.map((s) => s.name),

    // Experiences: map all fields directly
    experiences: dbPortfolio.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
    })),

    // Projects: techList is a comma-separated string in the DB — split back to array
    projects: dbPortfolio.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      techList: p.techList
        ? p.techList.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
    })),

    // Educations: graduation year is an Int in the DB
    educations: dbPortfolio.educations.map((ed) => ({
      id: ed.id,
      degree: ed.degree,
      institution: ed.institution,
      graduationYear: ed.graduationYear,
    })),

    // Social links: cast the type string to the union type
    socialLinks: dbPortfolio.socialLinks.map((sl) => ({
      type: sl.type as SocialLinkDTO["type"],
      url: sl.url,
    })),
  };

  // 5. Render the correct theme component (Requirement 14.3 & Requirement 10.5)
  if (portfolio.theme === "dark") {
    return <DarkTheme portfolio={portfolio} />;
  }
  if (portfolio.theme === "creative") {
    return <CreativeTheme portfolio={portfolio} />;
  }
  // Default: Minimal theme
  return <MinimalTheme portfolio={portfolio} />;
}
