/**
 * POST /api/bio/generate
 *
 * AI-powered professional bio generator.
 *
 * Flow:
 *  1. Verify authenticated session (401 if not)
 *  2. Parse { name, title, skills } from body; 400 if any missing
 *  3. Rate-limit check: max 10 generations per user per hour (429 if exceeded)
 *  4. Call OpenAI GPT-4o-mini to produce a 3–4 sentence bio
 *  5. Log the generation in BioGenerationLog
 *  6. Return { bio: string }
 *
 * Requirements: 4.5–4.8, 15.1–15.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import OpenAI from "openai";

// Maximum generations per user per rolling hour (Requirement 15.4)
const MAX_GENERATIONS_PER_HOUR = 10;

// OpenAI client — reads OPENAI_API_KEY from environment automatically
const openai = new OpenAI();

export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: { name?: unknown; title?: unknown; skills?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, title, skills } = body;

  // Validate all fields are present and non-empty
  if (
    typeof name !== "string" || !name.trim() ||
    typeof title !== "string" || !title.trim() ||
    !Array.isArray(skills) || skills.length === 0
  ) {
    return NextResponse.json(
      { error: "name, title, and at least one skill are required" },
      { status: 400 }
    );
  }

  // ── Rate limit check ───────────────────────────────────────────────────────
  // Count how many generations this user has done in the past hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.bioGenerationLog.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= MAX_GENERATIONS_PER_HOUR) {
    // Find the oldest log in the window to calculate when the limit resets
    const oldestLog = await prisma.bioGenerationLog.findFirst({
      where: { userId, createdAt: { gte: oneHourAgo } },
      orderBy: { createdAt: "asc" },
    });

    // Seconds until the oldest record falls out of the 1-hour window
    const retryAfterSeconds = oldestLog
      ? Math.ceil((oldestLog.createdAt.getTime() + 60 * 60 * 1000 - Date.now()) / 1000)
      : 3600;

    return NextResponse.json(
      { error: "Rate limit exceeded", retryAfterSeconds },
      { status: 429 }
    );
  }

  // ── Call OpenAI ────────────────────────────────────────────────────────────
  try {
    const skillsString = (skills as string[]).join(", ");
    const prompt = `Write a professional 3-4 sentence bio for ${name}, a ${title} with skills in ${skillsString}. Write in third person.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      // Keep response focused — bio shouldn't need more than 300 tokens
      max_tokens: 300,
      temperature: 0.7,
    });

    const bio = completion.choices[0]?.message?.content?.trim() ?? "";

    // ── Log the generation ────────────────────────────────────────────────
    await prisma.bioGenerationLog.create({ data: { userId } });

    return NextResponse.json({ bio });
  } catch (err) {
    // Log full error server-side; return safe message to client (Requirement 15.3)
    console.error("[POST /api/bio/generate] OpenAI error:", err);
    return NextResponse.json(
      { error: "Bio generation failed. Please try again." },
      { status: 503 }
    );
  }
}
