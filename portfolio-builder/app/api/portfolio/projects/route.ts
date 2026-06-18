/**
 * /api/portfolio/projects — GET, POST, DELETE
 *
 * GET    — Returns all projects for the authenticated user.
 * POST   — Creates a new project entry.
 * DELETE — Deletes a project by ID (via ?id= query param).
 *
 * Note: techList is stored in DB as a comma-separated string,
 * but returned to the client as a string array.
 *
 * Requirements: 7.1–7.7
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import type { ProjectDTO } from "@/src/types/portfolio";

const MAX_PROJECTS = 20;

// Helper: convert DB comma-string to string[]
function parseTechList(raw: string): string[] {
  return raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : [];
}

// ── GET /api/portfolio/projects ───────────────────────────────────────────────

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
    return NextResponse.json({ projects: [] });
  }

  const projects = await prisma.project.findMany({
    where: { portfolioId: portfolio.id },
    orderBy: { id: "asc" },
  });

  const dtos: ProjectDTO[] = projects.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    techList: parseTechList(p.techList),
    githubUrl: p.githubUrl,
    liveUrl: p.liveUrl,
  }));

  return NextResponse.json({ projects: dtos });
}

// ── POST /api/portfolio/projects ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

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

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  // Enforce max entries limit
  const count = await prisma.project.count({ where: { portfolioId: portfolio.id } });
  if (count >= MAX_PROJECTS) {
    return NextResponse.json(
      { error: `Maximum of ${MAX_PROJECTS} projects allowed` },
      { status: 422 }
    );
  }

  // Convert techList array to comma-separated string for storage
  const techArray = Array.isArray(body.techList) ? (body.techList as string[]) : [];
  const techListStr = techArray.join(",");

  const project = await prisma.project.create({
    data: {
      portfolioId: portfolio.id,
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : "",
      techList: techListStr,
      githubUrl: typeof body.githubUrl === "string" ? body.githubUrl : null,
      liveUrl: typeof body.liveUrl === "string" ? body.liveUrl : null,
    },
  });

  const dto: ProjectDTO = {
    id: project.id,
    title: project.title,
    description: project.description,
    techList: parseTechList(project.techList),
    githubUrl: project.githubUrl,
    liveUrl: project.liveUrl,
  };

  return NextResponse.json(dto, { status: 201 });
}

// ── DELETE /api/portfolio/projects?id=xxx ─────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("id");
  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, portfolioId: portfolio.id },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
