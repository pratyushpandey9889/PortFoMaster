/**
 * /api/portfolio/education — GET, POST, DELETE
 *
 * GET    — Returns all education entries for the authenticated user.
 * POST   — Creates a new education entry.
 * DELETE — Deletes an education entry by ID (via ?id= query param).
 *
 * Requirements: 8.1–8.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validateGraduationYear } from "@/src/lib/validators";
import type { EducationDTO } from "@/src/types/portfolio";

const MAX_EDUCATIONS = 10;

// ── GET /api/portfolio/education ──────────────────────────────────────────────

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
    return NextResponse.json({ educations: [] });
  }

  const educations = await prisma.education.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { id: "asc" },
  });

  const dtos: EducationDTO[] = educations.map((e) => ({
    id: e.id,
    degree: e.degree,
    institution: e.institution,
    graduationYear: e.graduationYear,
  }));

  return NextResponse.json({ educations: dtos });
}

// ── POST /api/portfolio/education ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: {
    degree?: unknown;
    institution?: unknown;
    graduationYear?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate graduation year (Requirement 8.5)
  const year = typeof body.graduationYear === "number"
    ? body.graduationYear
    : parseInt(String(body.graduationYear), 10);

  if (!isNaN(year)) {
    const yearValidation = validateGraduationYear(year);
    if (!yearValidation.ok) {
      return NextResponse.json({ error: yearValidation.error }, { status: 400 });
    }
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Enforce max entries limit (Requirement 8.3)
  const count = await prisma.education.count({ where: { portfolioId: portfolio.id } });
  if (count >= MAX_EDUCATIONS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_EDUCATIONS} education entries allowed` },
      { status: 422 }
    );
  }

  const education = await prisma.education.create({
    data: {
      portfolioId: portfolio.id,
      degree: typeof body.degree === "string" ? body.degree : "",
      institution: typeof body.institution === "string" ? body.institution : "",
      graduationYear: isNaN(year) ? new Date().getFullYear() : year,
    },
  });

  const dto: EducationDTO = {
    id: education.id,
    degree: education.degree,
    institution: education.institution,
    graduationYear: education.graduationYear,
  };

  return NextResponse.json(dto, { status: 201 });
}

// ── DELETE /api/portfolio/education?id=xxx ────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const educationId = searchParams.get("id");
  if (!educationId) {
    return NextResponse.json({ error: "Education ID is required" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const education = await prisma.education.findFirst({
    where: { id: educationId, portfolioId: portfolio.id },
  });
  if (!education) {
    return NextResponse.json({ error: "Education entry not found" }, { status: 404 });
  }

  await prisma.education.delete({ where: { id: educationId } });
  return NextResponse.json({ success: true });
}
