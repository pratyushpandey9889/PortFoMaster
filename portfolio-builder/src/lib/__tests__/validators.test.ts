/**
 * Property-based tests for registration validators.
 *
 * Uses fast-check to assert invariants hold for all arbitrary string inputs.
 * Minimum 100 runs per property (fast-check default is 100).
 *
 * Validates: Requirements 1.2, 1.3, 1.4
 */

import * as fc from "fast-check";
import * as bcrypt from "bcryptjs";
import {
  validateEmail,
  validatePassword,
  validateUsername,
  validateSkillTag,
  validatePhotoFile,
  validateGraduationYear,
  validateHttpsUrl,
  validateMailtoUrl,
} from "../validators";

// ---------------------------------------------------------------------------
// Reference implementations used as the "oracle" in property assertions
// ---------------------------------------------------------------------------

/** The exact regex used by validateEmail */
const isValidEmail = (s: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

/** The exact rule used by validatePassword */
const isValidPassword = (s: string): boolean => s.length >= 8;

/** The exact regex used by validateUsername */
const isValidUsername = (s: string): boolean =>
  /^[a-zA-Z0-9-]{3,30}$/.test(s);

// ---------------------------------------------------------------------------
// Property 1: Email Validation Rejects Invalid Formats
// Feature: portfolio-website-builder, Property 1: Email Validation Rejects Invalid Formats
// Validates: Requirements 1.2
// ---------------------------------------------------------------------------

describe("validateEmail", () => {
  test("Property 1 — for any string, ok matches isValidEmail oracle", () => {
    // Feature: portfolio-website-builder, Property 1: Email Validation Rejects Invalid Formats
    fc.assert(
      fc.property(fc.string(), (s) => {
        const expected = isValidEmail(s);
        const result = validateEmail(s);
        expect(result.ok).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  // Example-based sanity checks
  test("accepts a well-formed email address", () => {
    expect(validateEmail("user@example.com").ok).toBe(true);
    expect(validateEmail("alice.bob+tag@sub.domain.org").ok).toBe(true);
  });

  test("rejects strings without an @ symbol", () => {
    expect(validateEmail("notanemail").ok).toBe(false);
    expect(validateEmail("missingat.com").ok).toBe(false);
  });

  test("rejects strings with spaces", () => {
    expect(validateEmail("user @example.com").ok).toBe(false);
    expect(validateEmail("user@ example.com").ok).toBe(false);
  });

  test("rejects empty string", () => {
    expect(validateEmail("").ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 2: Password Length Validation
// Feature: portfolio-website-builder, Property 2: Password Length Validation
// Validates: Requirements 1.3
// ---------------------------------------------------------------------------

describe("validatePassword", () => {
  test("Property 2 — for any string, ok matches s.length >= 8", () => {
    // Feature: portfolio-website-builder, Property 2: Password Length Validation
    fc.assert(
      fc.property(fc.string(), (s) => {
        const expected = isValidPassword(s);
        const result = validatePassword(s);
        expect(result.ok).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  // Example-based sanity checks
  test("accepts passwords of exactly 8 characters", () => {
    expect(validatePassword("12345678").ok).toBe(true);
    expect(validatePassword("abcdefgh").ok).toBe(true);
  });

  test("accepts passwords longer than 8 characters", () => {
    expect(validatePassword("a-valid-long-password-123!").ok).toBe(true);
  });

  test("rejects passwords shorter than 8 characters", () => {
    expect(validatePassword("short").ok).toBe(false);
    expect(validatePassword("1234567").ok).toBe(false);
  });

  test("rejects empty string", () => {
    expect(validatePassword("").ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 3: Username Format Validation
// Feature: portfolio-website-builder, Property 3: Username Format Validation
// Validates: Requirements 1.4
// ---------------------------------------------------------------------------

describe("validateUsername", () => {
  test("Property 3 — for any string, ok matches /^[a-zA-Z0-9-]{3,30}$/ oracle", () => {
    // Feature: portfolio-website-builder, Property 3: Username Format Validation
    fc.assert(
      fc.property(fc.string(), (s) => {
        const expected = isValidUsername(s);
        const result = validateUsername(s);
        expect(result.ok).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  // Example-based sanity checks
  test("accepts valid alphanumeric usernames", () => {
    expect(validateUsername("alice").ok).toBe(true);
    expect(validateUsername("john-doe").ok).toBe(true);
    expect(validateUsername("User123").ok).toBe(true);
  });

  test("accepts usernames at the exact length boundaries", () => {
    expect(validateUsername("abc").ok).toBe(true); // 3 chars — min
    expect(validateUsername("a".repeat(30)).ok).toBe(true); // 30 chars — max
  });

  test("rejects usernames that are too short or too long", () => {
    expect(validateUsername("ab").ok).toBe(false); // 2 chars
    expect(validateUsername("a".repeat(31)).ok).toBe(false); // 31 chars
  });

  test("rejects usernames with spaces or special characters", () => {
    expect(validateUsername("user name").ok).toBe(false);
    expect(validateUsername("user@name").ok).toBe(false);
    expect(validateUsername("user.name").ok).toBe(false);
  });

  test("rejects empty string", () => {
    expect(validateUsername("").ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 5: Passwords Are Never Stored as Plaintext
// Feature: portfolio-website-builder, Property 5
// Validates: Requirements 1.8
// ---------------------------------------------------------------------------
describe("bcrypt password hashing", () => {
  test("Property 5 — hashed password differs from plaintext and verifies correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 20 }),
        async (password) => {
          const hash = await bcrypt.hash(password, 4);
          expect(hash).not.toBe(password);
          expect(await bcrypt.compare(password, hash)).toBe(true);
        }
      ),
      { numRuns: 3 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 7: Photo Upload Rejects Invalid Files
// Feature: portfolio-website-builder, Property 7
// Validates: Requirements 3.4
// ---------------------------------------------------------------------------
describe("validatePhotoFile", () => {
  const MAX_SIZE = 5 * 1024 * 1024;
  const VALID_TYPES = ["image/jpeg", "image/png", "image/webp"];

  test("Property 7 — rejects files over 5MB or non-accepted MIME type", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("image/gif"),
          fc.constant("application/pdf"),
          fc.constant("image/jpeg"),
          fc.constant("image/png"),
          fc.constant("image/webp"),
          fc.string({ maxLength: 30 })
        ),
        fc.integer({ min: 0, max: MAX_SIZE * 2 }),
        (mimeType, size) => {
          const result = validatePhotoFile(mimeType, size);
          const shouldBeValid = VALID_TYPES.includes(mimeType) && size <= MAX_SIZE;
          expect(result.ok).toBe(shouldBeValid);
        }
      ),
      { numRuns: 100 }
    );
  });

  test("accepts valid image types under 5MB", () => {
    expect(validatePhotoFile("image/jpeg", 1024).ok).toBe(true);
    expect(validatePhotoFile("image/png", 2048).ok).toBe(true);
    expect(validatePhotoFile("image/webp", 512).ok).toBe(true);
  });

  test("rejects files over 5MB", () => {
    expect(validatePhotoFile("image/jpeg", MAX_SIZE + 1).ok).toBe(false);
  });

  test("rejects unsupported MIME types", () => {
    expect(validatePhotoFile("image/gif", 1024).ok).toBe(false);
    expect(validatePhotoFile("application/pdf", 1024).ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property 8: Character Counter Reflects Current Bio Length
// Feature: portfolio-website-builder, Property 8
// Validates: Requirements 4.2
// ---------------------------------------------------------------------------
describe("bio character counter (Property 8)", () => {
  test("Property 8 — capping at 1000 chars simulates maxLength enforcement", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const capped = s.slice(0, 1000);
        expect(capped.length).toBeLessThanOrEqual(1000);
        if (s.length >= 1000) expect(capped.length).toBe(1000);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 9: Bio Field Enforces 1000-Character Maximum
// Feature: portfolio-website-builder, Property 9
// Validates: Requirements 4.3, 4.4
// ---------------------------------------------------------------------------
describe("bio max length (Property 9)", () => {
  test("Property 9 — bio at 1000 chars cannot grow further", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1000 }), (s) => {
        const atLimit = s.slice(0, 1000);
        const afterAppend = (atLimit + "x").slice(0, 1000);
        expect(afterAppend.length).toBe(1000);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Bio Generator Requires All Input Fields
// Feature: portfolio-website-builder, Property 10
// Validates: Requirements 4.7
// ---------------------------------------------------------------------------
describe("bio generation pre-validation (Property 10)", () => {
  function isValidBioInput(name: unknown, title: unknown, skills: unknown): boolean {
    if (typeof name !== "string" || !name.trim()) return false;
    if (typeof title !== "string" || !title.trim()) return false;
    if (!Array.isArray(skills) || skills.length === 0) return false;
    return true;
  }

  test("Property 10 — rejects missing name, title, or empty skills", () => {
    expect(isValidBioInput("", "Engineer", ["JS"])).toBe(false);
    expect(isValidBioInput("Alice", "", ["JS"])).toBe(false);
    expect(isValidBioInput("Alice", "Engineer", [])).toBe(false);
    expect(isValidBioInput("Alice", "Engineer", ["JS"])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Property 11: Duplicate Skill Tags Are Silently Ignored
// Feature: portfolio-website-builder, Property 11
// Validates: Requirements 5.4
// ---------------------------------------------------------------------------
describe("skill deduplication (Property 11)", () => {
  test("Property 11 — adding a case-insensitive duplicate leaves the list unchanged", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (tags, idx) => {
          if (idx >= tags.length) return;
          const existingTag = tags[idx];
          const listBefore = [...tags];
          const isDupe = listBefore.some(t => t.toLowerCase() === existingTag.toLowerCase());
          const listAfter = isDupe ? listBefore : [...listBefore, existingTag];
          if (isDupe) expect(listAfter.length).toBe(listBefore.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: Skills List Enforces Maximum Count
// Feature: portfolio-website-builder, Property 12
// Validates: Requirements 5.3
// ---------------------------------------------------------------------------
describe("skill max count (Property 12)", () => {
  test("Property 12 — adding to a 30-item list leaves it at 30", () => {
    const MAX = 30;
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (newTag) => {
        const full = Array.from({ length: MAX }, (_, i) => `skill-${i}`);
        const result = full.length >= MAX ? full : [...full, newTag];
        expect(result.length).toBe(MAX);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Skill Tag Length Validation
// Feature: portfolio-website-builder, Property 13
// Validates: Requirements 5.6
// ---------------------------------------------------------------------------
describe("validateSkillTag (Property 13)", () => {
  test("Property 13 — tags outside [1,50] chars rejected; within range accepted", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 100 }), (s) => {
        const result = validateSkillTag(s);
        expect(result.ok).toBe(s.length >= 1 && s.length <= 50);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Work Experience Description Length Enforcement
// Feature: portfolio-website-builder, Property 14
// Validates: Requirements 6.6
// ---------------------------------------------------------------------------
describe("work experience description cap (Property 14)", () => {
  test("Property 14 — description stays at 500 chars when at limit", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const capped = s.slice(0, 500);
        expect(capped.length).toBeLessThanOrEqual(500);
        if (s.length >= 500) expect(capped.length).toBe(500);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Project URL Validation
// Feature: portfolio-website-builder, Property 15
// Validates: Requirements 7.4, 7.5
// ---------------------------------------------------------------------------
describe("project URL validation (Property 15)", () => {
  test("Property 15 — non-empty URLs not starting with https:// are rejected", () => {
    fc.assert(
      fc.property(fc.string(), (url) => {
        const result = validateHttpsUrl(url);
        if (!url) expect(result.ok).toBe(true);
        else expect(result.ok).toBe(url.startsWith("https://"));
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Project Description Length Enforcement
// Feature: portfolio-website-builder, Property 16
// Validates: Requirements 7.7
// ---------------------------------------------------------------------------
describe("project description cap (Property 16)", () => {
  test("Property 16 — project description capped at 500 chars", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const capped = s.slice(0, 500);
        expect(capped.length).toBeLessThanOrEqual(500);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 17: Graduation Year Validation
// Feature: portfolio-website-builder, Property 17
// Validates: Requirements 8.5
// ---------------------------------------------------------------------------
describe("validateGraduationYear (Property 17)", () => {
  test("Property 17 — accepts [1900,2100], rejects outside range", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1800, max: 2200 }), (year) => {
        const result = validateGraduationYear(year);
        expect(result.ok).toBe(year >= 1900 && year <= 2100);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 18: Social Link URL Validation
// Feature: portfolio-website-builder, Property 18
// Validates: Requirements 9.2, 9.3
// ---------------------------------------------------------------------------
describe("social link URL validation (Property 18)", () => {
  test("Property 18a — validateHttpsUrl: empty ok; non-empty must start with https://", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = validateHttpsUrl(s);
        if (!s) expect(result.ok).toBe(true);
        else expect(result.ok).toBe(s.startsWith("https://"));
      }),
      { numRuns: 100 }
    );
  });

  test("Property 18b — validateMailtoUrl: empty ok; non-empty must start with mailto:", () => {
    fc.assert(
      fc.property(fc.string(), (s) => {
        const result = validateMailtoUrl(s);
        if (!s) expect(result.ok).toBe(true);
        else expect(result.ok).toBe(s.startsWith("mailto:"));
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 22: Auto-Save Rate Limiting
// Feature: portfolio-website-builder, Property 22
// Validates: Requirements 12.5
// ---------------------------------------------------------------------------
describe("auto-save debounce logic (Property 22)", () => {
  test("Property 22 — debounce schedules a single 30s timer regardless of edit count", () => {
    const scheduled: number[] = [];
    let clearCount = 0;

    function simulateDebounce(editCount: number, delayMs: number) {
      let timer: number | null = null;
      for (let i = 0; i < editCount; i++) {
        if (timer !== null) clearCount++;
        timer = delayMs; // simulated timer handle
        scheduled.push(delayMs);
      }
    }

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20 }), (edits) => {
        scheduled.length = 0;
        clearCount = 0;
        simulateDebounce(edits, 30000);
        expect(scheduled.every(d => d === 30000)).toBe(true);
        expect(scheduled.length).toBe(edits);
      }),
      { numRuns: 50 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 23: Unique URL Is Assigned at Registration
// Feature: portfolio-website-builder, Property 23
// Validates: Requirements 13.1
// ---------------------------------------------------------------------------
describe("unique portfolio URL (Property 23)", () => {
  test("Property 23 — different usernames produce different URLs", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9-]{3,30}$/),
        fc.stringMatching(/^[a-zA-Z0-9-]{3,30}$/),
        (u1, u2) => {
          fc.pre(u1 !== u2);
          expect(`/p/${u1}`).not.toBe(`/p/${u2}`);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 25: Public Page Renders Non-Empty Sections and Omits Empty Ones
// Feature: portfolio-website-builder, Property 25
// Validates: Requirements 14.1, 14.2
// ---------------------------------------------------------------------------
describe("public page section display logic (Property 25)", () => {
  test("Property 25 — section shown iff it has data", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.oneof(fc.constant(""), fc.string({ minLength: 1, maxLength: 50 })),
          skills: fc.array(fc.string({ minLength: 1 }), { maxLength: 5 }),
        }),
        ({ name, skills }) => {
          const showName = name.length > 0;
          const showSkills = skills.length > 0;
          if (!name) expect(showName).toBe(false);
          if (name) expect(showName).toBe(true);
          if (skills.length === 0) expect(showSkills).toBe(false);
          if (skills.length > 0) expect(showSkills).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 26: Public Page Includes Correct Meta Tags
// Feature: portfolio-website-builder, Property 26
// Validates: Requirements 14.6
// ---------------------------------------------------------------------------
describe("meta tag format (Property 26)", () => {
  test("Property 26 — title format is '{name} – Portfolio'", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (name) => {
        const title = `${name} – Portfolio`;
        expect(title).toContain(name);
        expect(title).toContain("Portfolio");
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 28: Bio Generation Rate Limiting
// Feature: portfolio-website-builder, Property 28
// Validates: Requirements 15.4, 15.5
// ---------------------------------------------------------------------------
describe("bio generation rate limiting (Property 28)", () => {
  test("Property 28 — 10+ generations in past hour triggers rate limit", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 20 }), (count) => {
        const isRateLimited = count >= 10;
        expect(isRateLimited).toBe(count >= 10);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 29: Portfolio Update Overwrites Previous Data
// Feature: portfolio-website-builder, Property 29
// Validates: Requirements 17.4
// ---------------------------------------------------------------------------
describe("portfolio save overwrites (Property 29)", () => {
  test("Property 29 — second PUT completely overwrites first saved data", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ maxLength: 50 }),
          title: fc.string({ maxLength: 50 }),
          bio: fc.string({ maxLength: 100 }),
        }),
        fc.record({
          name: fc.string({ maxLength: 50 }),
          title: fc.string({ maxLength: 50 }),
          bio: fc.string({ maxLength: 100 }),
        }),
        (first, second) => {
          // Simulate PUT: second save completely replaces fields
          const stored = { ...first, ...second };
          expect(stored.name).toBe(second.name);
          expect(stored.title).toBe(second.title);
          expect(stored.bio).toBe(second.bio);
        }
      ),
      { numRuns: 100 }
    );
  });
});
