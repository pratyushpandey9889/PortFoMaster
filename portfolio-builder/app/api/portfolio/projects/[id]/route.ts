/**
 * PUT /api/portfolio/projects/[id]
 *
 * Updates a specific project entry by ID.
 * Verifies ownership and converts techList array to a comma-separated string.
 *
 * Requirements: 7.1–7.7
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import type { ProjectDTO } from "@/src/types/portfolio";

// Helper: parse comma-separated DB string to array
function parseTechList(raw: string): string[] {
  return raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

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
    title?: unknown;
    description?: unknown;
    techList?: unknown;
    githubUrl?: unknown;
    liveUrl?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Verify ownership
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id, portfolioId: portfolio.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Build update payload
  const updateData: Record<string, unknown> = {};
  if (typeof body.title === "string") updateData.title = body.title;
  if (typeof body.description === "string") updateData.description = body.description;
  if (Array.isArray(body.techList)) {
    updateData.techList = (body.techList as string[]).join(",");
  }
  if (body.githubUrl !== undefined) {
    updateData.githubUrl = typeof body.githubUrl === "string" ? body.githubUrl : null;
  }
  if (body.liveUrl !== undefined) {
    updateData.liveUrl = typeof body.liveUrl === "string" ? body.liveUrl : null;
  }

  const updated = await prisma.project.update({ where: { id }, data: updateData });

  const dto: ProjectDTO = {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    techList: parseTechList(updated.techList),
    githubUrl: updated.githubUrl,
    liveUrl: updated.liveUrl,
  };

  return NextResponse.json(dto);
}
