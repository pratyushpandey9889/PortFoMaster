/**
 * POST /api/auth/register
 *
 * Registers a new user account. Steps:
 *   1. Parse and validate the submitted email, password, and username.
 *   2. Check that the email and username are not already taken.
 *   3. Hash the password with bcrypt (cost factor 12).
 *   4. Create a User record and an empty Portfolio record in one transaction.
 *   5. Return { success: true, username } with HTTP 201.
 *
 * Error responses follow a consistent shape: { error: string }
 */

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import {
  validateEmail,
  validatePassword,
  validateUsername,
} from "@/src/lib/validators";

export async function POST(req: NextRequest) {
  // ── 1. Parse request body ─────────────────────────────────────────────────
  let body: { email?: unknown; password?: unknown; username?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password, username } = body;

  // Ensure all fields are strings before validation
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof username !== "string"
  ) {
    return NextResponse.json(
      { error: "email, password, and username are required" },
      { status: 400 }
    );
  }

  // ── 2. Validate each field with our pure validators ───────────────────────
  const emailResult = validateEmail(email);
  if (!emailResult.ok) {
    return NextResponse.json({ error: emailResult.error }, { status: 400 });
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.ok) {
    return NextResponse.json({ error: passwordResult.error }, { status: 400 });
  }

  const usernameResult = validateUsername(username);
  if (!usernameResult.ok) {
    return NextResponse.json({ error: usernameResult.error }, { status: 400 });
  }

  // ── 3. Check for duplicate email ──────────────────────────────────────────
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return NextResponse.json(
      { error: "Email already registered" },
      { status: 409 }
    );
  }

  // ── 4. Check for duplicate username ───────────────────────────────────────
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    return NextResponse.json(
      { error: "Username already taken" },
      { status: 409 }
    );
  }

  // ── 5. Hash the password (bcrypt cost factor 12) ──────────────────────────
  // Cost factor 12 is a good balance between security and speed.
  // Higher values are more secure but slower; lower values are faster but weaker.
  const passwordHash = await bcrypt.hash(password, 12);

  // ── 6. Create User + empty Portfolio in a single transaction ──────────────
  // Using a transaction ensures both records are created atomically:
  // if one fails, neither is saved (no orphaned users without portfolios).
  try {
    const { user } = await prisma.$transaction(async (tx) => {
      // Create the user record
      const user = await tx.user.create({
        data: {
          email,
          username,
          passwordHash,
        },
      });

      // Create an empty portfolio associated with the new user.
      // All fields default to empty strings (defined in the schema).
      await tx.portfolio.create({
        data: {
          userId: user.id,
        },
      });

      return { user };
    });

    // ── 7. Return success ──────────────────────────────────────────────────
    return NextResponse.json(
      { success: true, username: user.username },
      { status: 201 }
    );
  } catch (err) {
    // Catch any unexpected DB errors (e.g. race condition on unique constraint)
    console.error("[register] DB error:", err);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
