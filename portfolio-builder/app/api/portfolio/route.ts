/**
 * /api/portfolio — GET and PUT handlers
 *
 * GET  — Returns the full PortfolioDTO for the currently authenticated user.
 *         Includes all related data: skills, experiences, projects, educations, socialLinks.
 *
 * PUT  — Updates the top-level portfolio fields (name, title, location, bio, theme)
 *         and optionally upserts socialLinks if they are included in the request body.
 *         Other sections (skills, experiences, projects, educations) have dedicated routes.
 *
 * Both routes require an authenticated session. Unauthenticated requests get a 401.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validateHttpsUrl, validateMailtoUrl } from "@/src/lib/validators";
import type { PortfolioDTO, SocialLinkDTO } from "@/src/types/portfolio";

// Valid theme values — enforced on PUT
const VALID_THEMES = ["minimal", "dark", "creative"] as const;
type ValidTheme = (typeof VALID_THEMES)[number];

// ── GET /api/portfolio ─────────────────────────────────────────────────────────

export async function GET() {
  // Check for a valid session; return 401 if not authenticated
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch the portfolio including all related records
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: {
      skills: true,          // Skill[]
      experiences: true,     // WorkExperience[]
      projects: true,        // Project[]
      educations: true,      // Education[]
      socialLinks: true,     // SocialLink[]
    },
  });

  // If somehow no portfolio exists (shouldn't happen after registration), return 404
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // ── Map the Prisma records to the PortfolioDTO shape ──────────────────────
  //
  // The DTO is the "shape" React will work with in the editor.
  // We convert database types (e.g. comma-separated techList string) to
  // the richer types the frontend expects (e.g. string[]).

  const dto: PortfolioDTO = {
    name: portfolio.name,
    title: portfolio.title,
    location: portfolio.location,
    bio: portfolio.bio,
    theme: portfolio.theme as ValidTheme,
    photoUrl: portfolio.photoUrl,

    // skills: array of skill name strings (frontend just needs the name, not the id)
    skills: portfolio.skills.map((s) => s.name),

    // experiences: map all fields directly — dates are already stored as strings
    experiences: portfolio.experiences.map((e) => ({
      id: e.id,
      company: e.company,
      role: e.role,
      startDate: e.startDate,
      endDate: e.endDate,
      isCurrent: e.isCurrent,
      description: e.description,
    })),

    // projects: techList is stored as a comma-separated string in the DB;
    // split it back into an array (filter out empty strings from trailing commas)
    projects: portfolio.projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      techList: p.techList
        ? p.techList.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      githubUrl: p.githubUrl,
      liveUrl: p.liveUrl,
    })),

    // educations: map directly, graduation year is an Int in the DB
    educations: portfolio.educations.map((ed) => ({
      id: ed.id,
      degree: ed.degree,
      institution: ed.institution,
      graduationYear: ed.graduationYear,
    })),

    // socialLinks: cast the `type` string to the union type used by SocialLinkDTO
    socialLinks: portfolio.socialLinks.map((sl) => ({
      type: sl.type as SocialLinkDTO["type"],
      url: sl.url,
    })),
  };

  return NextResponse.json(dto);
}

// The four supported social link types
const SOCIAL_TYPES = ["github", "linkedin", "twitter", "email"] as const;
type SocialType = (typeof SOCIAL_TYPES)[number];

// ── PUT /api/portfolio ─────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  // Check for a valid session
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Parse the request body
  let body: {
    name?: unknown;
    title?: unknown;
    location?: unknown;
    bio?: unknown;
    theme?: unknown;
    socialLinks?: unknown;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, title, location, bio, theme, socialLinks } = body;

  // ── Validate theme ─────────────────────────────────────────────────────────
  // Theme must be one of the three supported values if provided
  if (theme !== undefined && !VALID_THEMES.includes(theme as ValidTheme)) {
    return NextResponse.json(
      {
        error: `Invalid theme. Must be one of: ${VALID_THEMES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // ── Build the update payload (only include fields that were sent) ──────────
  // Using Partial so callers can update just the theme without sending all fields
  const updateData: Record<string, unknown> = {};
  if (typeof name === "string") updateData.name = name;
  if (typeof title === "string") updateData.title = title;
  if (typeof location === "string") updateData.location = location;
  if (typeof bio === "string") updateData.bio = bio;
  if (typeof theme === "string") updateData.theme = theme;

  // ── Persist to database ────────────────────────────────────────────────────
  try {
    // Get the portfolio id (needed for social link upserts below)
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    // Update top-level portfolio fields
    await prisma.portfolio.update({
      where: { userId },
      data: updateData,
    });

    // ── Upsert social links if provided ──────────────────────────────────────
    // socialLinks arrives as an array of { type, url } objects from the DTO.
    // We build a map from type → url, then for each of the 4 known types:
    //   - non-empty url → upsert the record
    //   - missing or empty → delete the record if it exists
    if (Array.isArray(socialLinks)) {
      // Build a map from the incoming array
      const incomingMap: Record<string, string> = {};
      for (const link of socialLinks as SocialLinkDTO[]) {
        if (typeof link.type === "string" && typeof link.url === "string") {
          incomingMap[link.type] = link.url.trim();
        }
      }

      // Validate URLs before writing
      for (const type of SOCIAL_TYPES) {
        const url = incomingMap[type] ?? "";
        if (!url) continue;
        const result =
          type === "email" ? validateMailtoUrl(url) : validateHttpsUrl(url);
        if (!result.ok) {
          return NextResponse.json(
            { error: `${type}: ${result.error}` },
            { status: 400 }
          );
        }
      }

      // Upsert or delete each social link type
      for (const type of SOCIAL_TYPES as readonly SocialType[]) {
        const url = incomingMap[type] ?? "";

        if (url) {
          // Non-empty → upsert
          const existing = await prisma.socialLink.findFirst({
            where: { portfolioId: portfolio.id, type },
            select: { id: true },
          });
          if (existing) {
            await prisma.socialLink.update({
              where: { id: existing.id },
              data: { url },
            });
          } else {
            await prisma.socialLink.create({
              data: { portfolioId: portfolio.id, type, url },
            });
          }
        } else {
          // Empty → remove if it exists
          await prisma.socialLink.deleteMany({
            where: { portfolioId: portfolio.id, type },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    // Log the full error server-side for debugging; return a safe message to the client
    console.error("[PUT /api/portfolio] DB error:", err);
    return NextResponse.json(
      { error: "Failed to save portfolio. Please try again." },
      { status: 500 }
    );
  }
}
