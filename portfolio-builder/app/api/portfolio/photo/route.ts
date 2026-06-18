/**
 * POST /api/portfolio/photo
 *
 * Handles profile photo uploads.
 *
 * Flow:
 *  1. Verify authenticated session (401 if not)
 *  2. Parse multipart form data; get the 'photo' file
 *  3. Validate MIME type and file size server-side
 *  4. Write the file to public/uploads/{userId}/{timestamp}-{originalname}
 *  5. Update portfolio.photoUrl in the database
 *  6. Return { photoUrl: string }
 *
 * Requirements: 3.2–3.5
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { validatePhotoFile } from "@/src/lib/validators";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ── Parse multipart form data ─────────────────────────────────────────────
  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = data.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No photo file provided" }, { status: 400 });
  }

  // ── Server-side validation (mirrors client-side check) ────────────────────
  const validation = validatePhotoFile(file.type, file.size);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // ── Build file path ────────────────────────────────────────────────────────
  // Sanitise the original filename: keep only alphanumeric, dot, hyphen, underscore
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filename = `${Date.now()}-${safeName}`;

  // Directory: <project-root>/public/uploads/<userId>/
  const uploadDir = path.join(process.cwd(), "public", "uploads", userId);
  const filePath = path.join(uploadDir, filename);

  // ── Write to disk ──────────────────────────────────────────────────────────
  try {
    // Create the user-specific directory if it doesn't exist
    await fs.mkdir(uploadDir, { recursive: true });

    // Convert the File to a Buffer and write it
    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));
  } catch (err) {
    console.error("[POST /api/portfolio/photo] File write error:", err);
    return NextResponse.json({ error: "Failed to save photo. Please try again." }, { status: 500 });
  }

  // ── Update database ────────────────────────────────────────────────────────
  // The URL is relative to the /public directory — Next.js serves it directly
  const photoUrl = `/uploads/${userId}/${filename}`;
  try {
    await prisma.portfolio.update({
      where: { userId },
      data: { photoUrl },
    });
  } catch (err) {
    console.error("[POST /api/portfolio/photo] DB update error:", err);
    return NextResponse.json({ error: "Failed to update portfolio. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ photoUrl });
}
