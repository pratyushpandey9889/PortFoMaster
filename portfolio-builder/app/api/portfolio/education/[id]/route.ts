/**
 * PUT /api/portfolio/education/[id]
 *
 * Updates a specific education entry by ID.
 * Validates graduation year and verifies ownership.
 *
 * Requirements: 8.1–8.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validateGraduationYear } from "@/src/lib/validators";
import type { EducationDTO } from "@/src/types/portfolio";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const { id } = await params;

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

  // Validate graduation year if provided (Requirement 8.5)
  if (body.graduationYear !== undefined) {
    const year =
      typeof body.graduationYear === "number"
        ? body.graduationYear
        : parseInt(String(body.graduationYear), 10);

    if (!isNaN(year)) {
      const result = validateGraduationYear(year);
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
    }
  }

  // Verify ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const education = await prisma.education.findFirst({
    where: { id, portfolioId: portfolio.id },
  });
  if (!education) {
    return NextResponse.json({ error: "Education entry not found" }, { status: 404 });
  }

  // Build update payload
  const updateData: Record<string, unknown> = {};
  if (typeof body.degree === "string") updateData.degree = body.degree;
  if (typeof body.institution === "string") updateData.institution = body.institution;
  if (body.graduationYear !== undefined) {
    const year =
      typeof body.graduationYear === "number"
        ? body.graduationYear
        : parseInt(String(body.graduationYear), 10);
    if (!isNaN(year)) updateData.graduationYear = year;
  }

  const updated = await prisma.education.update({ where: { id }, data: updateData });

  const dto: EducationDTO = {
    id: updated.id,
    degree: updated.degree,
    institution: updated.institution,
    graduationYear: updated.graduationYear,
  };

  return NextResponse.json(dto);
}
