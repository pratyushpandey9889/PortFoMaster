/**
 * PUT /api/portfolio/experience/[id]
 *
 * Updates a specific work experience entry by ID.
 * Verifies that the entry belongs to the authenticated user.
 *
 * Requirements: 6.1–6.6
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import type { WorkExperienceDTO } from "@/src/types/portfolio";

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

  // Verify ownership — make sure this experience belongs to the authenticated user
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const experience = await prisma.workExperience.findFirst({
    where: { id, portfolioId: portfolio.id },
  });
  if (!experience) {
    return NextResponse.json({ error: "Experience entry not found" }, { status: 404 });
  }

  // Build update data (only update fields that were sent)
  const updateData: Record<string, unknown> = {};
  if (typeof body.company === "string") updateData.company = body.company;
  if (typeof body.role === "string") updateData.role = body.role;
  if (typeof body.startDate === "string") updateData.startDate = body.startDate;
  if (body.endDate !== undefined)
    updateData.endDate = typeof body.endDate === "string" ? body.endDate : null;
  if (typeof body.isCurrent === "boolean") updateData.isCurrent = body.isCurrent;
  if (typeof body.description === "string") updateData.description = body.description;

  const updated = await prisma.workExperience.update({
    where: { id },
    data: updateData,
  });

  const dto: WorkExperienceDTO = {
    id: updated.id,
    company: updated.company,
    role: updated.role,
    startDate: updated.startDate,
    endDate: updated.endDate,
    isCurrent: updated.isCurrent,
    description: updated.description,
  };

  return NextResponse.json(dto);
}
