/**
 * /api/portfolio/experience — GET, POST, DELETE
 *
 * GET    — Returns all work experience entries for the authenticated user.
 * POST   — Creates a new work experience entry.
 * DELETE — Deletes a work experience entry by ID (via ?id= query param).
 *
 * Requirements: 6.1–6.6
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import type { WorkExperienceDTO } from "@/src/types/portfolio";

const MAX_EXPERIENCES = 20;

// ── GET /api/portfolio/experience ─────────────────────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ experiences: [] });
  }

  const experiences = await prisma.workExperience.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { id: "asc" },
  });

  const dtos: WorkExperienceDTO[] = experiences.map((e) => ({
    id: e.id,
    company: e.company,
    role: e.role,
    startDate: e.startDate,
    endDate: e.endDate,
    isCurrent: e.isCurrent,
    description: e.description,
  }));

  return NextResponse.json({ experiences: dtos });
}

// ── POST /api/portfolio/experience ────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    company?: unknown;
    role?: unknown;
    startDate?: unknown;
    endDate?: unknown;
    isCurrent?: unknown;
    description?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Enforce max entries limit (Requirement 6.3)
  const count = await prisma.workExperience.count({
    where: { portfolioId: portfolio.id },
  });
  if (count >= MAX_EXPERIENCES) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_EXPERIENCES} work experience entries allowed` },
      { status: 422 }
    );
  }

  const experience = await prisma.workExperience.create({
    data: {
      portfolioId: portfolio.id,
      company: typeof body.company === "string" ? body.company : "",
      role: typeof body.role === "string" ? body.role : "",
      startDate: typeof body.startDate === "string" ? body.startDate : "",
      endDate: typeof body.endDate === "string" ? body.endDate : null,
      isCurrent: typeof body.isCurrent === "boolean" ? body.isCurrent : false,
      description: typeof body.description === "string" ? body.description : "",
    },
  });

  const dto: WorkExperienceDTO = {
    id: experience.id,
    company: experience.company,
    role: experience.role,
    startDate: experience.startDate,
    endDate: experience.endDate,
    isCurrent: experience.isCurrent,
    description: experience.description,
  };

  return NextResponse.json(dto, { status: 201 });
}

// ── DELETE /api/portfolio/experience?id=xxx ───────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const experienceId = searchParams.get("id");
  if (!experienceId) {
    return NextResponse.json({ error: "Experience ID is required" }, { status: 400 });
  }

  // Verify ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const experience = await prisma.workExperience.findFirst({
    where: { id: experienceId, portfolioId: portfolio.id },
  });
  if (!experience) {
    return NextResponse.json({ error: "Experience entry not found" }, { status: 404 });
  }

  await prisma.workExperience.delete({ where: { id: experienceId } });
  return NextResponse.json({ success: true });
}
