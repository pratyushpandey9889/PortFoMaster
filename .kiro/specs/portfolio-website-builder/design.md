# Design Document: Portfolio Website Builder

## Overview

The Portfolio Website Builder is a full-stack web application that lets users create, edit, and share personal portfolio pages without writing code. A user registers, fills out a guided form in a split-screen editor, picks a visual theme, and gets a unique public URL they can share immediately.

The system is intentionally kept simple for beginners: one Next.js project handles both the frontend and backend, SQLite stores all data in a single file (no separate database server to run), and files are stored locally. The architecture can be migrated to a production database (PostgreSQL) and cloud file storage later with minimal changes.

### Tech Stack

| Concern | Choice | Reasoning |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack in one project; built-in routing, SSR, and API routes |
| Language | TypeScript | Type safety reduces bugs and improves IDE experience |
| UI library | React 18 | Component model maps naturally to the editor and preview sections |
| Styling | Tailwind CSS | Utility classes make responsive design fast without custom CSS files |
| Database | SQLite via Prisma ORM | File-based, zero setup — ideal for beginners and local dev |
| Auth | NextAuth.js v5 (Auth.js) | Handles sessions, JWT cookies, and credential providers out of the box |
| AI | OpenAI API (`gpt-4o-mini`) | Low cost, fast, good quality for bio-length text generation |
| File storage | Local filesystem (`/uploads`) | No external dependencies; easily swapped for S3/Cloudinary later |
| Deployment | Vercel | Zero-config deployment for Next.js projects |

---

## Architecture

The application follows a standard Next.js App Router structure. All routes live under `src/app/`. API routes are co-located in `src/app/api/`. The database layer is accessed exclusively through Prisma — no raw SQL queries appear in route handlers.

```
Browser
  │
  ├─ App Router (Next.js 14)
  │    ├─ /                  Landing page (Server Component)
  │    ├─ /register          Registration form (Client Component)
  │    ├─ /login             Login form (Client Component)
  │    ├─ /editor            Split-screen editor (Client Component, protected)
  │    └─ /p/[username]      Public portfolio (Server Component, SSR)
  │
  ├─ API Routes
  │    ├─ /api/auth/[...nextauth]   NextAuth.js session + credential handlers
  │    ├─ /api/portfolio            GET / PUT — full portfolio object
  │    ├─ /api/portfolio/photo      POST — multipart photo upload
  │    ├─ /api/portfolio/skills     POST / DELETE — skill management
  │    ├─ /api/portfolio/experience POST / PUT / DELETE — work experience CRUD
  │    ├─ /api/portfolio/projects   POST / PUT / DELETE — projects CRUD
  │    ├─ /api/portfolio/education  POST / PUT / DELETE — education CRUD
  │    ├─ /api/portfolio/social-links PUT — social links upsert
  │    └─ /api/bio/generate         POST — AI bio generation
  │
  └─ Database (SQLite via Prisma)
```

### Request Flow

1. **Public page** — Next.js server renders `/p/[username]` at request time (SSR). Prisma fetches the portfolio by username directly on the server. No API call needed.
2. **Editor** — Client component holds all portfolio state in React. User edits are reflected in the live preview instantly (no round-trip). A debounced auto-save (30 s) or manual "Save" button flushes state to the API.
3. **Auth** — NextAuth.js manages sessions. Protected routes check the session server-side via `auth()` in layout or middleware. Unauthenticated requests are redirected to `/login`.

---

## Components and Interfaces

### Page Components

| Component | Route | Rendering |
|---|---|---|
| `LandingPage` | `/` | Server Component |
| `RegisterPage` | `/register` | Client Component |
| `LoginPage` | `/login` | Client Component |
| `EditorPage` | `/editor` | Client Component (auth-guarded) |
| `PublicPortfolioPage` | `/p/[username]` | Server Component (SSR) |
| `NotFoundPage` | `/p/[username]` (missing) | Server Component |

### Editor Components

```
EditorPage
├── EditorLayout          — split-screen wrapper, handles responsive stacking + toggle
│   ├── FormPanel         — left side: tabbed/sectioned form
│   │   ├── PersonalInfoForm   — name, title, location, photo upload
│   │   ├── BioForm            — textarea + char counter + "Generate Bio" button
│   │   ├── SkillsForm         — tag input + removable skill chips
│   │   ├── ExperienceForm     — repeatable work experience entries
│   │   ├── ProjectsForm       — repeatable project entries
│   │   ├── EducationForm      — repeatable education entries
│   │   ├── SocialLinksForm    — four URL inputs (GitHub, LinkedIn, Twitter, Email)
│   │   └── ThemeSelector      — 3 theme thumbnail cards
│   └── PreviewPanel      — right side: live preview driven by React state
│       ├── MinimalTheme       — renders portfolio with Minimal styling
│       ├── DarkTheme          — renders portfolio with Dark styling
│       └── CreativeTheme      — renders portfolio with Creative styling
└── SaveBar               — Save button + public URL display + Copy Link button
```

### Shared / Utility Components

- `SkillChip` — renders a single removable skill tag
- `ExperienceCard` — read-only entry card used in PreviewPanel
- `ProjectCard` — read-only project card used in PreviewPanel
- `PhotoUpload` — file input with drag-and-drop, preview, and validation
- `CharCounter` — reusable character counter for textareas
- `Notification` — toast-style success/error messages
- `ThemeCard` — selectable theme thumbnail

### API Interface Contracts

**`GET /api/portfolio`**
Returns the full portfolio object for the authenticated user.
```typescript
Response: PortfolioDTO // see Data Models
```

**`PUT /api/portfolio`**
Saves all top-level portfolio fields (name, title, location, bio, theme).
```typescript
Body: Partial<PortfolioDTO>
Response: { success: boolean }
```

**`POST /api/portfolio/photo`**
Multipart form upload. Validates file type and size server-side.
```typescript
Body: FormData { photo: File }
Response: { photoUrl: string }
```

**`POST /api/bio/generate`**
```typescript
Body: { name: string; title: string; skills: string[] }
Response: { bio: string } | { error: string; retryAfterSeconds?: number }
```

---

## Data Models

### Prisma Schema

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  username     String   @unique
  passwordHash String
  createdAt    DateTime @default(now())

  portfolio        Portfolio?
  bioGenerationLogs BioGenerationLog[]
}

model Portfolio {
  id        String   @id @default(cuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  name      String   @default("")
  title     String   @default("")
  location  String   @default("")
  bio       String   @default("")
  theme     String   @default("minimal")
  photoUrl  String?
  updatedAt DateTime @updatedAt

  skills      Skill[]
  experiences WorkExperience[]
  projects    Project[]
  educations  Education[]
  socialLinks SocialLink[]
}

model Skill {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)
  name        String
}

model WorkExperience {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  company     String
  role        String
  startDate   String    // stored as "YYYY-MM" string for simplicity
  endDate     String?   // null when isCurrent is true
  isCurrent   Boolean   @default(false)
  description String    @default("")
}

model Project {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  title       String
  description String    @default("")
  techList    String    // comma-separated; parsed to array in application layer
  githubUrl   String?
  liveUrl     String?
}

model Education {
  id             String    @id @default(cuid())
  portfolioId    String
  portfolio      Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  degree         String
  institution    String
  graduationYear Int
}

model SocialLink {
  id          String    @id @default(cuid())
  portfolioId String
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  type        String    // "github" | "linkedin" | "twitter" | "email"
  url         String
}

model BioGenerationLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

### Application-Layer DTOs

```typescript
// The shape the editor works with in React state and API responses
interface PortfolioDTO {
  name: string;
  title: string;
  location: string;
  bio: string;
  theme: "minimal" | "dark" | "creative";
  photoUrl: string | null;
  skills: string[];          // ["React", "TypeScript", ...]
  experiences: WorkExperienceDTO[];
  projects: ProjectDTO[];
  educations: EducationDTO[];
  socialLinks: SocialLinkDTO[];
}

interface WorkExperienceDTO {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  description: string;
}

interface ProjectDTO {
  id: string;
  title: string;
  description: string;
  techList: string[];
  githubUrl: string | null;
  liveUrl: string | null;
}

interface EducationDTO {
  id: string;
  degree: string;
  institution: string;
  graduationYear: number;
}

interface SocialLinkDTO {
  type: "github" | "linkedin" | "twitter" | "email";
  url: string;
}
```

---


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property reflection notes:** After prework analysis, several properties were consolidated:
- Criteria 3.3/3.5 (photo storage + personal info persistence) are separate concerns and kept distinct.
- Criteria 1.2, 1.3, 1.4 (individual field validators) are kept separate as each tests a different validation rule.
- Criteria 7.4/7.5 are combined — they both describe the same URL validation behavior.
- Criteria 10.3–10.5 overlap (theme applied in preview, saved, and shown on public page); 10.3 and 11.2 overlap on the "preview updates within 500ms" invariant — they are consolidated.
- Criteria 14.1/14.2 are combined into a single "non-empty sections shown, empty omitted" property.
- Criteria 15.4/15.5 are combined into one rate-limiting property.

---

### Property 1: Email Validation Rejects Invalid Formats

*For any* string that does not conform to a valid email address format, the registration validator SHALL reject it; *for any* string that does conform to a valid email format, the validator SHALL accept it.

**Validates: Requirements 1.2**

---

### Property 2: Password Length Validation

*For any* string of length less than 8 characters, the registration validator SHALL reject it as a password; *for any* string of length 8 or greater, the validator SHALL accept it.

**Validates: Requirements 1.3**

---

### Property 3: Username Format Validation

*For any* string that contains characters other than alphanumeric characters or hyphens, or has a length outside the range [3, 30], the registration validator SHALL reject it as a username; *for any* string satisfying both constraints the validator SHALL accept it.

**Validates: Requirements 1.4**

---

### Property 4: Registration Creates Portfolio

*For any* valid, unique (email, password, username) triple submitted to registration, the system SHALL create exactly one Portfolio record associated with that user.

**Validates: Requirements 1.7**

---

### Property 5: Passwords Are Never Stored as Plaintext

*For any* password string provided during registration, the value stored in the database SHALL NOT equal the original plaintext string, and the bcrypt verify function SHALL confirm the hash matches the original.

**Validates: Requirements 1.8**

---

### Property 6: Unauthenticated Access to Protected Routes Redirects

*For any* protected route in the application, an HTTP request made without a valid session SHALL receive a redirect response pointing to the login page.

**Validates: Requirements 2.7**

---

### Property 7: Photo Upload Rejects Invalid Files

*For any* file whose size exceeds 5 MB or whose MIME type is not JPEG, PNG, or WebP, the upload endpoint SHALL reject the file, return an error describing the violation, and SHALL NOT write the file to storage.

**Validates: Requirements 3.4**

---

### Property 8: Character Counter Reflects Current Bio Length

*For any* string typed into the bio field, the character counter SHALL display a value exactly equal to the current length of the string in the field.

**Validates: Requirements 4.2**

---

### Property 9: Bio Field Enforces 1000-Character Maximum

*For any* bio string already at 1000 characters, attempting to append additional characters SHALL leave the field length unchanged at 1000.

**Validates: Requirements 4.3, 4.4**

---

### Property 10: Bio Generator Requires All Input Fields

*For any* Generate Bio request where at least one of (name, professional title, skill tags list) is absent or empty, the system SHALL reject the request and return an error listing the missing fields, without calling the OpenAI API.

**Validates: Requirements 4.7**

---

### Property 11: Duplicate Skill Tags Are Silently Ignored

*For any* skill tag already present in the user's skill list (compared case-insensitively), attempting to add the same tag again SHALL leave the list unchanged.

**Validates: Requirements 5.4**

---

### Property 12: Skills List Enforces Maximum Count

*For any* user who already has 30 skill tags, attempting to add another tag SHALL leave the skills list unchanged at 30 entries.

**Validates: Requirements 5.3**

---

### Property 13: Skill Tag Length Validation

*For any* skill tag string with length outside [1, 50] characters, the validator SHALL reject the tag and not add it to the list; *for any* string within [1, 50] characters, the tag SHALL be accepted.

**Validates: Requirements 5.6**

---

### Property 14: Work Experience Description Length Enforcement

*For any* work experience description string, the form SHALL not accept input exceeding 500 characters, leaving the field at exactly 500 characters when the limit is reached.

**Validates: Requirements 6.6**

---

### Property 15: Project URL Validation

*For any* GitHub URL or live demo URL field in a project entry that contains a non-empty value not beginning with "https://", the save operation SHALL be rejected and an error message SHALL be shown for that specific field.

**Validates: Requirements 7.4, 7.5**

---

### Property 16: Project Description Length Enforcement

*For any* project description string, the form SHALL not accept input exceeding 500 characters.

**Validates: Requirements 7.7**

---

### Property 17: Graduation Year Validation

*For any* graduation year value that is not a four-digit integer in the range [1900, 2100], the validator SHALL reject it and display an error; *for any* value within that range, it SHALL be accepted.

**Validates: Requirements 8.5**

---

### Property 18: Social Link URL Validation

*For any* social link URL (GitHub, LinkedIn, Twitter) that does not begin with "https://", the save operation SHALL be rejected with a field-level error; *for any* email social link that does not begin with "mailto:", the save operation SHALL be rejected with a field-level error.

**Validates: Requirements 9.2, 9.3**

---

### Property 19: Preview Reflects Form Changes Within 500ms

*For any* change made to any field in the Form, the PreviewPanel SHALL display the updated value within 500 milliseconds without a full page reload.

**Validates: Requirements 10.3, 11.2**

---

### Property 20: Preview Uses Currently Selected Theme

*For any* theme selected in the ThemeSelector, the PreviewPanel SHALL render the portfolio using that theme's styles.

**Validates: Requirements 11.3**

---

### Property 21: Save Validates All Fields Before Persisting

*For any* portfolio state containing at least one validation error (as defined by any requirement constraint), activating the Save button SHALL display all validation errors and SHALL NOT write any data to the database.

**Validates: Requirements 12.2**

---

### Property 22: Auto-Save Rate Limiting

*For any* period of active editing, the auto-save mechanism SHALL trigger at most one save operation per 30-second window — no matter how many field edits occur within that window.

**Validates: Requirements 12.5**

---

### Property 23: Unique URL Is Assigned at Registration

*For any* successfully registered user with username `u`, the system SHALL assign the public URL `/p/u` and no other user SHALL share that same URL.

**Validates: Requirements 13.1**

---

### Property 24: Public Page Is Accessible Without Authentication

*For any* valid username whose portfolio has been saved, an HTTP request to `/p/{username}` made without an authenticated session SHALL return a successful (200) response rendering the portfolio page.

**Validates: Requirements 13.5**

---

### Property 25: Public Page Renders Non-Empty Sections and Omits Empty Ones

*For any* portfolio where some sections contain data and others are empty, the rendered public page SHALL include exactly the sections that contain data and SHALL NOT render placeholder markup for empty sections.

**Validates: Requirements 14.1, 14.2**

---

### Property 26: Public Page Includes Correct Meta Tags

*For any* portfolio, the server-rendered public page HTML SHALL include a `<title>` tag containing the user's name, a `<meta name="description">` tag containing the bio, and Open Graph tags (`og:title`, `og:description`) matching the same values.

**Validates: Requirements 14.6**

---

### Property 27: Bio Generator Returns 3–4 Sentences Within 10 Seconds

*For any* valid (name, title, skills) input, the Bio_Generator SHALL return a response containing between 3 and 4 sentences, and the round-trip latency SHALL be at most 10 seconds.

**Validates: Requirements 15.2**

---

### Property 28: Bio Generation Rate Limiting

*For any* user who has made 10 or more Bio_Generator calls within the past hour, the next call SHALL be rejected with an error message indicating the rate limit and the time remaining until the next call is allowed.

**Validates: Requirements 15.4, 15.5**

---

### Property 29: Portfolio Update Overwrites Previous Data

*For any* portfolio that has been saved once, saving updated portfolio data SHALL result in the stored values matching the most recent save — not a combination of old and new values.

**Validates: Requirements 17.4**

---

## Error Handling

### Validation Errors (Client-Side)

All form fields are validated on the client before any API call is made. Validation errors are displayed inline next to the offending field. The Save button is disabled while any field contains a validation error. This gives immediate feedback without network round-trips.

| Scenario | Behavior |
|---|---|
| Email not RFC-5322 format | Inline error on email field |
| Password < 8 chars | Inline error on password field |
| Invalid username format/length | Inline error on username field |
| Duplicate email / username | Error returned from API, shown as form-level error |
| Photo > 5 MB or wrong type | Error shown in PhotoUpload component |
| Bio > 1000 chars | Input capped; counter shown in red |
| Skill tag > 50 chars | Tag not added; error displayed |
| Work experience desc > 500 chars | Textarea capped at 500 |
| Project URL not starting with https:// | Field-level error |
| Graduation year out of range | Field-level error |
| Social link URL invalid | Field-level error |

### API / Server Errors

| Scenario | Behavior |
|---|---|
| Save fails (network/server error) | Toast error notification; unsaved state retained in React |
| Bio generation fails (OpenAI error) | Toast error; bio field left unchanged |
| Bio rate limit exceeded | Error message with remaining time; button disabled |
| Photo upload fails | Error shown in upload component |
| 404 on public page | Render custom 404 with "Portfolio not found" message |
| DB failure on any API route | Return HTTP 500; display user-friendly toast in editor |

### Security

- Passwords hashed with bcrypt at cost factor 12 before storage.
- Session tokens stored as httpOnly cookies managed by NextAuth.js (not accessible to JavaScript).
- All protected API routes call `auth()` from NextAuth and return 401 if no valid session.
- File uploads validate MIME type and size server-side (client-side check is a UX aid only).
- SQL injection is prevented by Prisma's parameterised queries throughout.
- OpenAI API key is stored in an environment variable, never sent to the browser.
- Rate limiting for bio generation is enforced server-side using `BioGenerationLog` counts.

---

## Testing Strategy

### Approach

This project uses a dual testing approach. Unit / property tests cover pure logic and business rules; integration tests cover API routes and database interactions; end-to-end tests cover the critical user journeys.

**Property-based testing library**: [`fast-check`](https://github.com/dubzzz/fast-check) (TypeScript-native, works with Jest/Vitest).

### Unit & Property Tests

All validators (email, password, username, URL, graduation year, skill tags, file type/size) are extracted into pure functions in `src/lib/validators.ts`. These are tested with both example-based unit tests and property-based tests using `fast-check`.

Each correctness property in this document maps to one `fc.assert` block in the test suite, tagged with a comment:

```typescript
// Feature: portfolio-website-builder, Property 3: Username Format Validation
test("property 3 — username validation accepts/rejects correctly", () => {
  fc.assert(
    fc.property(fc.string(), (s) => {
      const valid = /^[a-zA-Z0-9-]{3,30}$/.test(s);
      expect(validateUsername(s).ok).toBe(valid);
    }),
    { numRuns: 100 }
  );
});
```

Minimum 100 iterations per property test.

### Component Tests

React Testing Library is used for component-level tests:
- Form components render correct fields and display errors
- `CharCounter` reflects current length for any input
- `ThemeSelector` applies theme class to preview wrapper
- `PreviewPanel` updates within 500 ms after state change (using fake timers)
- `PhotoUpload` shows error for oversized / wrong-type files

### API Route Tests

Jest + `node-mocks-http` (or Next.js `createMocks`) test each API handler in isolation with a seeded in-memory SQLite database:
- Auth routes (register, login, logout)
- Portfolio CRUD
- Photo upload (mocked filesystem)
- Bio generation (mocked OpenAI client)
- Rate limiting logic

### End-to-End Tests

Playwright covers the critical user journeys:
1. Register → Editor loads with empty profile
2. Fill personal info, add skills, add experience → Save → Reload → Data persists
3. Select a theme → Preview updates → Save → Public page reflects theme
4. Generate Bio → Bio populates → Save → Public page shows bio
5. Navigate to `/p/{username}` as unauthenticated visitor → Portfolio renders correctly
6. Navigate to `/p/nonexistent` → 404 shown

---

## Implementation Plan

Tasks are ordered from foundational to feature-complete. Each task is independently deployable.

### Task 1 — Project Scaffolding and Database Setup

- `npx create-next-app@latest` with TypeScript, Tailwind CSS, App Router
- Install Prisma, `@prisma/client`; configure SQLite datasource
- Create `prisma/schema.prisma` with all models defined above
- Run `npx prisma migrate dev` to generate the SQLite file
- Seed script for a test user + empty portfolio
- Verify `prisma studio` shows tables correctly
- Configure `src/lib/prisma.ts` singleton

### Task 2 — Authentication (Register, Login, Session)

- Install `next-auth@beta` (`auth.js` v5)
- Configure `src/auth.ts` with Credentials provider
- Implement `POST /api/auth/register` — validate fields, hash password (bcrypt), create User + empty Portfolio
- Implement NextAuth sign-in callback to look up user and verify bcrypt hash
- Create `/register` page with form validation (email, password, username)
- Create `/login` page with form validation
- Add middleware `src/middleware.ts` to protect `/editor` route
- Test: unauthenticated `/editor` → redirects to `/login`

### Task 3 — Portfolio Read / Write API

- Implement `GET /api/portfolio` — returns full `PortfolioDTO` for session user
- Implement `PUT /api/portfolio` — updates top-level portfolio fields (name, title, location, bio, theme)
- All handlers require authenticated session (401 otherwise)
- Write API route tests with seeded DB

### Task 4 — Editor Shell and Live Preview Foundation

- Create `/editor` page as a Client Component
- Build `EditorLayout` (CSS Grid: 50/50 split on ≥ 1024 px, stacked on smaller)
- Build `PreviewPanel` skeleton that reads from React state (no API calls)
- Build `SaveBar` with Save button, public URL display, Copy Link button
- Wire up `usePortfolio` custom hook to load portfolio on mount (`GET /api/portfolio`) and expose state setters
- Auto-save: use `useEffect` + `debounce` (30 s min interval) calling `PUT /api/portfolio`

### Task 5 — Personal Information Form

- Build `PersonalInfoForm` (name, title, location inputs)
- Build `PhotoUpload` component — file input, drag-and-drop, client-side type/size validation
- Implement `POST /api/portfolio/photo` — validate server-side, write to `/public/uploads/{userId}/{filename}`, update `portfolio.photoUrl`
- Wire form values to `usePortfolio` state so preview updates live

### Task 6 — Bio Form and AI Bio Generation

- Build `BioForm` — multiline textarea, `CharCounter`, 1000-char cap
- Build "Generate Bio" button + loading state
- Implement `POST /api/bio/generate` — validate inputs, count `BioGenerationLog` rows in past hour, call OpenAI API, insert log row, return bio text
- Wire to `BioForm`; on success, populate bio field
- Display rate-limit error with remaining time when limit exceeded

### Task 7 — Skills Form

- Build `SkillsForm` — text input to add tags, `SkillChip` list
- Client-side: case-insensitive duplicate check, 30-tag cap, 1–50 char validation
- Implement `POST /api/portfolio/skills` and `DELETE /api/portfolio/skills/:id`
- On save, sync full skills list (delete removed, insert new)

### Task 8 — Work Experience Form

- Build `ExperienceForm` — repeatable entries, collapsible cards
- Fields: company, role, startDate, endDate / isCurrent toggle, description (500-char cap)
- Implement `POST / PUT / DELETE /api/portfolio/experience`
- Pending deletes held in React state until Save

### Task 9 — Projects Form

- Build `ProjectsForm` — repeatable entries
- Fields: title, description (500-char cap), tech tags input, githubUrl, liveUrl
- Client-side URL validation (must start with `https://`)
- Implement `POST / PUT / DELETE /api/portfolio/projects`

### Task 10 — Education Form

- Build `EducationForm` — repeatable entries
- Fields: degree, institution, graduationYear
- Graduation year validation: 4-digit integer in [1900, 2100]
- Implement `POST / PUT / DELETE /api/portfolio/education`

### Task 11 — Social Links Form

- Build `SocialLinksForm` — four URL inputs
- Validation: GitHub/LinkedIn/Twitter start with `https://`; Email starts with `mailto:`
- Implement `PUT /api/portfolio/social-links` (upsert all four)
- Empty fields omit the link from storage and public page

### Task 12 — Theme System

- Create three theme objects / CSS modules: `MinimalTheme`, `DarkTheme`, `CreativeTheme`
- Each theme exposes a wrapper component that applies its palette, typography, and layout
- `ThemeSelector` renders three `ThemeCard` thumbnails
- Selecting a theme updates `usePortfolio` state → PreviewPanel re-renders immediately
- Theme persisted via `PUT /api/portfolio` on save

### Task 13 — Public Portfolio Page

- Build `/p/[username]` as a Next.js Server Component
- Fetch portfolio data via Prisma directly (server-side — no API call)
- Render all non-empty sections; omit sections with no data
- Apply correct theme component
- Include `<head>` meta tags: title, description, og:title, og:description, og:url
- Return 404 for unknown usernames

### Task 14 — Responsive Design Polish

- Audit all pages at 320 px, 768 px, 1024 px, 1440 px, 2560 px breakpoints
- Fix any horizontal overflow on mobile
- Ensure touch targets ≥ 44 px for skill chips, buttons, and form controls
- Verify EditorLayout toggle (Form ↔ Preview) works correctly below 1024 px
- Test photo upload and tag input on a touch device (or emulator)

### Task 15 — Validation and Error Handling Hardening

- Extract all validators into `src/lib/validators.ts`
- Add property-based tests for each validator using `fast-check`
- Add toast `Notification` component
- Wire all API error responses to toast notifications in the editor
- Test Save button blocked while validation errors exist

### Task 16 — README and Developer Documentation

- Document local setup steps (clone, `npm install`, `npx prisma migrate dev`, add `.env.local` with `OPENAI_API_KEY` and `AUTH_SECRET`)
- Document project structure
- Document environment variables required
- Include screenshots of the editor and a public portfolio page
