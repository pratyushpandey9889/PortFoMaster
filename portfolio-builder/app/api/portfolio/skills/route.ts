/**
 * /api/portfolio/skills — GET, POST, DELETE
 *
 * GET    — Returns all skill tags (with IDs) for the authenticated user.
 * POST   — Adds a new skill tag (validates, checks duplicates, enforces max 30).
 * DELETE — Removes a skill tag by ID (via ?id= query param), verifies ownership.
 *
 * Requirements: 5.1–5.6
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validateSkillTag } from "@/src/lib/validators";

const MAX_SKILLS = 30;

// ── GET /api/portfolio/skills ─────────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Get portfolio to find portfolioId
  const portfolio = await prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
  if (!portfolio) {
    return NextResponse.json({ skills: [] });
  }

  const skills = await prisma.skill.findMany({
    where: { portfolioId: portfolio.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ skills });
}

// ── POST /api/portfolio/skills ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Parse the request body
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";

  // Validate the tag
  const validation = validateSkillTag(name);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Get portfolio
  const portfolio = await prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Check for case-insensitive duplicate (Requirement 5.4)
  const existing = await prisma.skill.findMany({
    where: { portfolioId: portfolio.id },
    select: { id: true, name: true },
  });

  const isDuplicate = existing.some(
    (s) => s.name.toLowerCase() === name.toLowerCase()
  );
  if (isDuplicate) {
    return NextResponse.json({ error: "Skill already exists" }, { status: 409 });
  }

  // Enforce max limit (Requirement 5.3)
  if (existing.length >= MAX_SKILLS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_SKILLS} skills allowed` },
      { status: 422 }
    );
  }

  // Create the skill
  const skill = await prisma.skill.create({
    data: { portfolioId: portfolio.id, name },
    select: { id: true, name: true },
  });

  return NextResponse.json(skill, { status: 201 });
}

// ── DELETE /api/portfolio/skills?id=xxx ──────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Get the skill ID from the query string
  const { searchParams } = new URL(req.url);
  const skillId = searchParams.get("id");
  if (!skillId) {
    return NextResponse.json({ error: "Skill ID is required" }, { status: 400 });
  }

  // Get portfolio to verify ownership
  const portfolio = await prisma.portfolio.findUnique({ where: { userId }, select: { id: true } });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Verify the skill belongs to this portfolio (prevent cross-user deletion)
  const skill = await prisma.skill.findFirst({
    where: { id: skillId, portfolioId: portfolio.id },
  });
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 });
  }

  await prisma.skill.delete({ where: { id: skillId } });
  return NextResponse.json({ success: true });
}
