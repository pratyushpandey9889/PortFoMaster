/**
 * Pure validation functions for registration fields.
 * Each function returns { ok: true } on success or { ok: false, error: string } on failure.
 */

export interface ValidationResult {
  ok: boolean;
  error?: string;
}

/**
 * Validate email address using a basic RFC 5322 check.
 * Requires at least one character before @, a domain, and a TLD.
 */
export function validateEmail(s: string): ValidationResult {
  // Basic RFC 5322 pattern: local@domain.tld
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(s)) {
    return { ok: false, error: "Invalid email address format" };
  }
  return { ok: true };
}

/**
 * Validate password:
 * - minimum 8 characters
 */
export function validatePassword(s: string): ValidationResult {
  if (typeof s !== "string" || s.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters long" };
  }
  return { ok: true };
}

/**
 * Validate username:
 * - alphanumeric characters and hyphens only
 * - 3 to 30 characters long
 * - regex: /^[a-zA-Z0-9-]{3,30}$/
 */
export function validateUsername(s: string): ValidationResult {
  if (!s || typeof s !== "string") {
    return { ok: false, error: "Username is required" };
  }
  const usernameRegex = /^[a-zA-Z0-9-]{3,30}$/;
  if (!usernameRegex.test(s)) {
    return {
      ok: false,
      error:
        "Username must be 3–30 characters and contain only letters, numbers, and hyphens",
    };
  }
  return { ok: true };
}

/**
 * Validate a URL starts with https://
 */
export function validateHttpsUrl(s: string): ValidationResult {
  if (!s) {
    return { ok: true }; // empty is allowed (optional field)
  }
  if (!s.startsWith("https://")) {
    return { ok: false, error: "URL must start with https://" };
  }
  return { ok: true };
}

/**
 * Validate a mailto link starts with mailto:
 */
export function validateMailtoUrl(s: string): ValidationResult {
  if (!s) {
    return { ok: true }; // empty is allowed
  }
  if (!s.startsWith("mailto:")) {
    return { ok: false, error: "Email link must start with mailto:" };
  }
  return { ok: true };
}

/**
 * Validate graduation year is a 4-digit integer in [1900, 2100]
 */
export function validateGraduationYear(year: number): ValidationResult {
  if (!Number.isInteger(year)) {
    return { ok: false, error: "Graduation year must be a whole number" };
  }
  if (year < 1900 || year > 2100) {
    return {
      ok: false,
      error: "Graduation year must be between 1900 and 2100",
    };
  }
  return { ok: true };
}

/**
 * Validate skill tag length is between 1 and 50 characters
 */
export function validateSkillTag(s: string): ValidationResult {
  if (!s || typeof s !== "string") {
    return { ok: false, error: "Skill tag cannot be empty" };
  }
  if (s.length < 1 || s.length > 50) {
    return {
      ok: false,
      error: "Skill tag must be between 1 and 50 characters",
    };
  }
  return { ok: true };
}

/**
 * Validate an uploaded file's MIME type and size.
 * Accepted types: image/jpeg, image/png, image/webp
 * Maximum size: 5 MB
 */
export function validatePhotoFile(
  mimeType: string,
  sizeBytes: number
): ValidationResult {
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

  if (!acceptedTypes.includes(mimeType)) {
    return {
      ok: false,
      error: "Photo must be a JPEG, PNG, or WebP image",
    };
  }
  if (sizeBytes > maxSizeBytes) {
    return {
      ok: false,
      error: "Photo must be smaller than 5 MB",
    };
  }
  return { ok: true };
}
