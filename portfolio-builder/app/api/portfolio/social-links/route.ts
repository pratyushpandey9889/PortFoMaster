/**
 * PUT /api/portfolio/social-links
 *
 * Upserts all four social link types for the authenticated user.
 *
 * For each of the four types (github, linkedin, twitter, email):
 *  - If a non-empty value is provided: upsert the record
 *  - If the value is empty or absent: delete the existing record if any
 *
 * Returns { success: true } on completion.
 *
 * Requirements: 9.1–9.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validateHttpsUrl, validateMailtoUrl } from "@/src/lib/validators";

// The four supported social link types
type SocialType = "github" | "linkedin" | "twitter" | "email";

const SOCIAL_TYPES: SocialType[] = ["github", "linkedin", "twitter", "email"];

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: Partial<Record<SocialType, string>>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // ── Server-side validation ─────────────────────────────────────────────────
  for (const type of SOCIAL_TYPES) {
    const value = body[type];
    if (!value || !value.trim()) continue; // empty is fine (optional)

    const result = type === "email"
      ? validateMailtoUrl(value.trim())
      : validateHttpsUrl(value.trim());

    if (!result.ok) {
      return NextResponse.json(
        { error: `${type}: ${result.error}` },
        { status: 400 }
      );
    }
  }

  // ── Get portfolio ─────────────────────────────────────────────────────────
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // ── Upsert or delete each social link type ─────────────────────────────────
  for (const type of SOCIAL_TYPES) {
    const value = body[type]?.trim() ?? "";

    if (value) {
      // Non-empty: find existing record and update, or create a new one
      const existing = await prisma.socialLink.findFirst({
        where: { portfolioId: portfolio.id, type },
        select: { id: true },
      });

      if (existing) {
        await prisma.socialLink.update({
          where: { id: existing.id },
          data: { url: value },
        });
      } else {
        await prisma.socialLink.create({
          data: { portfolioId: portfolio.id, type, url: value },
        });
      }
    } else {
      // Empty: delete existing record if any
      await prisma.socialLink.deleteMany({
        where: { portfolioId: portfolio.id, type },
      });
    }
  }

  return NextResponse.json({ success: true });
}
