# Implementation Plan: Portfolio Website Builder

## Overview

Build a full-stack Next.js 14 (App Router) application with TypeScript, Tailwind CSS, Prisma/SQLite, NextAuth.js v5, and OpenAI integration. Tasks are ordered from foundational infrastructure to feature-complete, with each task building directly on the previous.

## Tasks

- [x] 1. Project Scaffolding and Database Setup
  - Run `npx create-next-app@latest` with TypeScript, Tailwind CSS, and App Router options
  - Install Prisma and `@prisma/client`; configure SQLite datasource in `prisma/schema.prisma`
  - Define all Prisma models: `User`, `Portfolio`, `Skill`, `WorkExperience`, `Project`, `Education`, `SocialLink`, `BioGenerationLog`
  - Run `npx prisma migrate dev --name init` to generate the SQLite database file
  - Create `src/lib/prisma.ts` singleton to prevent multiple Prisma client instances
  - Write a seed script `prisma/seed.ts` that creates a test user with an empty portfolio
  - Define all TypeScript DTO interfaces (`PortfolioDTO`, `WorkExperienceDTO`, `ProjectDTO`, `EducationDTO`, `SocialLinkDTO`) in `src/types/portfolio.ts`
  - _Requirements: 17.2, 17.3_

- [x] 2. Authentication (Register, Login, Session)
  - Install `next-auth@beta` and configure `src/auth.ts` with the Credentials provider
  - Implement `POST /api/auth/register`: validate email (RFC 5322), password (≥ 8 chars), and username (alphanumeric + hyphens, 3–30 chars); hash password with bcrypt (cost 12); create `User` + empty `Portfolio`; redirect to `/editor`
  - Implement the NextAuth sign-in callback to look up the user by email and verify bcrypt hash
  - Create `/register` page (`src/app/register/page.tsx`) as a Client Component with inline field validation and error display
  - Create `/login` page (`src/app/login/page.tsx`) as a Client Component; display generic "invalid credentials" error without leaking which field is wrong
  - Create `src/middleware.ts` to protect the `/editor` route; redirect unauthenticated requests to `/login`
  - On successful registration, assign the public URL `/p/{username}` and display it after redirect
  - [x] 2.1 Write property tests for registration validators
    - **Property 1: Email Validation Rejects Invalid Formats** — `fc.assert` over arbitrary strings; expect `validateEmail(s).ok === isValidEmail(s)`
    - **Property 2: Password Length Validation** — `fc.assert` over arbitrary strings; expect `validatePassword(s).ok === s.length >= 8`
    - **Property 3: Username Format Validation** — `fc.assert` over arbitrary strings; expect `validateUsername(s).ok === /^[a-zA-Z0-9-]{3,30}$/.test(s)`
    - **Validates: Requirements 1.2, 1.3, 1.4**
  - [ ]* 2.2 Write unit tests for auth routes (register, login, session)
    - Test duplicate email and username return correct error messages
    - Test successful registration creates `User` + `Portfolio` in the seeded DB
    - Test unauthenticated `GET /editor` redirects to `/login` (Property 6)
    - **Validates: Requirements 1.5, 1.6, 1.7, 2.3, 2.4, 2.7**
  - _Requirements: 1.1–1.8, 2.1–2.7_

- [x] 3. Portfolio Read / Write API
  - Implement `GET /api/portfolio`: verify session (401 if absent); query full `PortfolioDTO` for the session user via Prisma; return JSON
  - Implement `PUT /api/portfolio`: verify session; validate and update top-level fields (`name`, `title`, `location`, `bio`, `theme`) via Prisma upsert
  - Return HTTP 401 for unauthenticated requests and HTTP 500 with a user-friendly message for DB failures
  - [ ]* 3.1 Write API route tests with a seeded in-memory SQLite DB
    - Test `GET /api/portfolio` returns the correct `PortfolioDTO` shape for an authenticated user
    - Test `PUT /api/portfolio` overwrites previous values (Property 29)
    - Test both routes return 401 when no session is present
    - **Validates: Requirements 12.1, 17.1, 17.4**
  - _Requirements: 12.1–12.5, 17.1–17.5_


- [x] 4. Editor Shell and Live Preview Foundation
  - Create `/editor` page (`src/app/editor/page.tsx`) as a Client Component (auth-guarded via middleware)
  - Build `EditorLayout` component using CSS Grid: 50/50 split on screens ≥ 1024 px; stacked with Form/Preview toggle below 1024 px
  - Build `PreviewPanel` skeleton that reads from React state and renders a placeholder layout for each portfolio section
  - Build `SaveBar` component displaying the Save button, the user's public URL, and a Copy Link button with clipboard copy + confirmation toast
  - Implement `usePortfolio` custom hook: loads portfolio on mount via `GET /api/portfolio`, exposes state and setters, and runs a debounced auto-save (minimum 30 s interval) via `PUT /api/portfolio`
  - [ ]* 4.1 Write component tests for EditorLayout and SaveBar
    - Test layout switches to stacked mode below 1024 px and toggle control appears
    - Test Copy Link button copies the URL and shows confirmation message
    - **Validates: Requirements 11.1, 11.4, 13.2, 13.3, 13.4**
  - _Requirements: 11.1, 11.4, 12.4, 12.5, 13.2–13.4_

- [x] 5. Personal Information Form
  - Build `PersonalInfoForm` component with controlled inputs for full name, professional title, and location; wire all values to `usePortfolio` state so `PreviewPanel` updates live
  - Build `PhotoUpload` component with file input, drag-and-drop zone, client-side MIME type and size validation (JPEG/PNG/WebP, ≤ 5 MB), and image preview
  - Implement `POST /api/portfolio/photo`: verify session; validate file type and size server-side; write file to `/public/uploads/{userId}/{filename}`; update `portfolio.photoUrl`
  - [ ]* 5.1 Write property test for photo upload validation
    - **Property 7: Photo Upload Rejects Invalid Files** — assert that any file > 5 MB or with a non-accepted MIME type is rejected without writing to storage
    - **Validates: Requirements 3.4**
  - [ ]* 5.2 Write unit tests for PersonalInfoForm and PhotoUpload
    - Test valid photo upload updates `photoUrl` in state and preview
    - Test oversized / wrong-type file shows error and does not call the upload API
    - **Validates: Requirements 3.1–3.5**
  - _Requirements: 3.1–3.5_

- [x] 6. Bio Form and AI Bio Generation
  - Build `BioForm` component: multiline textarea, `CharCounter` showing live character count, 1000-character hard cap (prevent input beyond limit), and cap-reached message
  - Build "Generate Bio" button with loading/disabled state; validate that name, title, and at least one skill tag are present before calling the API; display field-level errors if not
  - Implement `POST /api/bio/generate`: verify session; validate required inputs; count `BioGenerationLog` rows in the past hour; if < 10, call OpenAI `gpt-4o-mini`, insert a log row, and return bio text; if ≥ 10, return rate-limit error with remaining seconds
  - On success, populate the bio textarea; on rate-limit error, disable the button and show remaining time
  - [x] 6.1 Write property tests for bio field and generator constraints
    - **Property 8: Character Counter Reflects Current Bio Length** — assert counter value equals `bioString.length` for any string
    - **Property 9: Bio Field Enforces 1000-Character Maximum** — assert bio field length stays at 1000 when at-limit string receives append
    - **Property 10: Bio Generator Requires All Input Fields** — assert API rejects any request missing name, title, or skills without calling OpenAI
    - **Property 28: Bio Generation Rate Limiting** — assert that a user with ≥ 10 logs in the past hour receives a rate-limit error
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.7, 15.4, 15.5**
  - [ ]* 6.2 Write unit tests for BioForm and bio generate API route
    - Test successful generation populates the bio field (mocked OpenAI client)
    - Test generation failure shows error toast and leaves bio unchanged
    - Test "keep / regenerate / edit" flow after a generated bio
    - **Validates: Requirements 4.5, 4.6, 4.8, 15.1–15.3**
  - _Requirements: 4.1–4.8, 15.1–15.5_

- [x] 7. Skills Form
  - Build `SkillsForm` component: text input for adding tags, list of `SkillChip` components (each removable); enforce case-insensitive duplicate check, 30-tag maximum, and 1–50 character tag length with inline errors
  - Implement `POST /api/portfolio/skills` (add a skill) and `DELETE /api/portfolio/skills/:id` (remove a skill); sync the full skill list on save (delete removed, insert new)
  - [x] 7.1 Write property tests for skills validation
    - **Property 11: Duplicate Skill Tags Are Silently Ignored** — assert adding a tag already in the list (any case) leaves the list unchanged
    - **Property 12: Skills List Enforces Maximum Count** — assert that adding a tag to a 30-item list leaves the list at 30
    - **Property 13: Skill Tag Length Validation** — assert tags outside [1, 50] chars are rejected; tags within range are accepted
    - **Validates: Requirements 5.3, 5.4, 5.6**
  - [ ]* 7.2 Write unit tests for SkillsForm
    - Test removing a skill chip updates state and preview
    - Test skills sync correctly on save (API calls for added and deleted skills)
    - **Validates: Requirements 5.1, 5.2, 5.5**
  - _Requirements: 5.1–5.6_


- [x] 8. Work Experience Form
  - Build `ExperienceForm` component: repeatable collapsible entry cards with fields for company, role, start date, end date / "Current" toggle, and description (500-char hard cap)
  - Implement `POST /api/portfolio/experience` (create), `PUT /api/portfolio/experience/:id` (update), and `DELETE /api/portfolio/experience/:id` (delete); hold pending deletes in React state until Save
  - [x] 8.1 Write property test for work experience description length
    - **Property 14: Work Experience Description Length Enforcement** — assert description field rejects input beyond 500 chars and stays at exactly 500
    - **Validates: Requirements 6.6**
  - [ ]* 8.2 Write unit tests for ExperienceForm
    - Test "Current" toggle sets `isCurrent: true` and clears `endDate`
    - Test pending-delete entries are visually removed but sent to the API only on Save
    - **Validates: Requirements 6.1–6.5**
  - _Requirements: 6.1–6.6_

- [x] 9. Projects Form
  - Build `ProjectsForm` component: repeatable entry cards with fields for title, description (500-char hard cap), tech tags input, optional GitHub URL, and optional live demo URL
  - Apply client-side URL validation (must start with `https://`); display field-level errors for all invalid URL fields within an entry
  - Implement `POST /api/portfolio/projects`, `PUT /api/portfolio/projects/:id`, `DELETE /api/portfolio/projects/:id`
  - [ ] 9.1 Write property tests for project field validation
    - **Property 15: Project URL Validation** — assert any non-empty URL not beginning with `https://` is rejected with a field-level error
    - **Property 16: Project Description Length Enforcement** — assert description field does not accept input beyond 500 chars
    - **Validates: Requirements 7.4, 7.5, 7.7**
  - [ ]* 9.2 Write unit tests for ProjectsForm
    - Test valid GitHub and live URLs are accepted and saved
    - Test entry deletion removes the project on next Save
    - **Validates: Requirements 7.1–7.3, 7.6**
  - _Requirements: 7.1–7.7_

- [x] 10. Education Form
  - Build `EducationForm` component: repeatable entry cards with fields for degree/qualification name, institution name, and graduation year
  - Apply graduation year validation: must be a four-digit integer in [1900, 2100]; display inline error for out-of-range values
  - Implement `POST /api/portfolio/education`, `PUT /api/portfolio/education/:id`, `DELETE /api/portfolio/education/:id`
  - [ ] 10.1 Write property test for graduation year validation
    - **Property 17: Graduation Year Validation** — assert any year outside [1900, 2100] is rejected with an error; any year within range is accepted
    - **Validates: Requirements 8.5**
  - [ ]* 10.2 Write unit tests for EducationForm
    - Test up to 10 entries can be added; adding an 11th is blocked
    - Test deleting an entry removes it from the list and from the DB on next Save
    - **Validates: Requirements 8.1–8.4**
  - _Requirements: 8.1–8.5_

- [x] 11. Social Links Form
  - Build `SocialLinksForm` component: four URL input fields (GitHub, LinkedIn, Twitter, Email); apply field-level validation (GitHub/LinkedIn/Twitter must start with `https://`; Email must start with `mailto:`)
  - Implement `PUT /api/portfolio/social-links` (upsert all four links); omit empty fields from storage and from the public page
  - [ ] 11.1 Write property test for social link URL validation
    - **Property 18: Social Link URL Validation** — assert GitHub/LinkedIn/Twitter URLs not starting with `https://` are rejected; Email URLs not starting with `mailto:` are rejected
    - **Validates: Requirements 9.2, 9.3**
  - [ ]* 11.2 Write unit tests for SocialLinksForm
    - Test empty fields are omitted without error
    - Test valid links are persisted via the upsert API
    - **Validates: Requirements 9.1, 9.4, 9.5**
  - _Requirements: 9.1–9.5_

- [x] 12. Theme System
  - Create three theme wrapper components: `MinimalTheme`, `DarkTheme`, `CreativeTheme` — each applies its own palette, typography, and layout via Tailwind CSS classes or CSS modules
  - Build `ThemeCard` component for selectable thumbnail previews; build `ThemeSelector` that renders all three `ThemeCard` components
  - Wire `ThemeSelector` selection to `usePortfolio` state so `PreviewPanel` switches theme immediately (within 500 ms)
  - Persist selected theme via `PUT /api/portfolio` on Save
  - [ ]* 12.1 Write component tests for ThemeSelector and PreviewPanel theme switching
    - Test selecting each theme applies the correct wrapper component to `PreviewPanel` within 500 ms (using fake timers)
    - **Property 20: Preview Uses Currently Selected Theme** — assert `PreviewPanel` renders with the selected theme's wrapper
    - **Validates: Requirements 10.1–10.5, 11.3**
  - _Requirements: 10.1–10.5, 11.3_


- [x] 13. Public Portfolio Page
  - Build `/p/[username]` as a Next.js Server Component (`src/app/p/[username]/page.tsx`); fetch portfolio data directly via Prisma (no API call) for SSR
  - Render all non-empty sections (Personal Info, Bio, Skills, Work Experience, Projects, Education, Social Links); omit any section where the user provided no data — no empty placeholders
  - Apply the correct theme wrapper component based on the stored `theme` value
  - Include `<head>` meta tags: `<title>` with user's name, `<meta name="description">` with bio, and Open Graph tags (`og:title`, `og:description`, `og:url`)
  - Return a custom 404 page with a "Portfolio not found" message for unknown usernames
  - Open Social Link clicks in a new browser tab
  - [ ] 13.1 Write property tests for public page behavior
    - **Property 23: Unique URL Is Assigned at Registration** — assert `/p/{username}` is unique and assigned on account creation
    - **Property 24: Public Page Is Accessible Without Authentication** — assert `GET /p/{username}` returns 200 without a session
    - **Property 25: Public Page Renders Non-Empty Sections and Omits Empty Ones** — assert sections with data are present and empty sections produce no markup
    - **Property 26: Public Page Includes Correct Meta Tags** — assert `<title>`, `<meta name="description">`, `og:title`, `og:description` match the user's name and bio
    - **Validates: Requirements 13.1, 13.5, 14.1, 14.2, 14.6**
  - [ ]* 13.2 Write integration tests for public portfolio page
    - Test social link opens in a new tab
    - Test 404 page rendered for an unknown username
    - **Validates: Requirements 13.6, 14.3, 14.4, 14.5**
  - _Requirements: 13.1, 13.5–13.6, 14.1–14.6_

- [x] 14. Responsive Design Polish
  - Audit and fix all pages at 320 px, 768 px, 1024 px, 1440 px, and 2560 px breakpoints; eliminate horizontal overflow on mobile
  - Ensure all interactive touch targets (skill chips, buttons, form controls) are at least 44 × 44 px
  - Verify `EditorLayout` form/preview toggle works correctly below 1024 px using Playwright on a mobile viewport
  - Test photo upload drag-and-drop and tag input on a touch device or browser emulator
  - Fix any Tailwind responsive utility issues across `EditorLayout`, `PreviewPanel`, and all form components
  - [ ]* 14.1 Write Playwright end-to-end tests covering responsive flows
    - Test editor at 375 px width: form/preview toggle is present and functional
    - Test public portfolio page at 320 px: no horizontal scroll, all sections readable
    - **Validates: Requirements 16.1–16.3**
  - _Requirements: 16.1–16.3_

- [x] 15. Validation and Error Handling Hardening
  - Extract all validator functions into `src/lib/validators.ts`: email, password, username, URL (`https://`), `mailto:`, graduation year, skill tag length, file type/size, bio length
  - Add a reusable toast `Notification` component and wire all API error responses (save failure, bio generation failure, photo upload failure, DB error) to display toast notifications in the editor
  - Ensure the Save button is disabled while any field contains a validation error; unblock only when all errors are resolved
  - Add server-side re-validation in all API routes to mirror client-side rules (defence in depth)
  - [ ] 15.1 Write property tests for all extracted validators
    - **Property 5: Passwords Are Never Stored as Plaintext** — assert `bcrypt.compare(original, stored)` is true and `stored !== original`
    - **Property 21: Save Validates All Fields Before Persisting** — assert Save with any invalid field shows all errors and makes no DB write
    - **Property 22: Auto-Save Rate Limiting** — assert auto-save fires at most once per 30-second window regardless of edit frequency
    - **Property 27: Bio Generator Returns 3–4 Sentences Within 10 Seconds** — assert response sentence count is in [3, 4] and latency ≤ 10 s (mocked timer)
    - **Property 29: Portfolio Update Overwrites Previous Data** — assert second save produces stored values equal to most recent save only
    - **Validates: Requirements 1.8, 12.2, 12.5, 15.2, 17.4**
  - [ ]* 15.2 Write unit tests for Notification component and save-button gating
    - Test toast appears for each API error scenario and auto-dismisses
    - Test Save button disabled state toggles correctly with validation errors
    - **Validates: Requirements 12.2–12.5, 17.5**
  - _Requirements: 1.8, 12.2–12.5, 17.4–17.5_

- [ ] 16. Checkpoint — Final validation before documentation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. README and Developer Documentation
  - Write `README.md` documenting local setup: clone, `npm install`, `npx prisma migrate dev`, create `.env.local` with `OPENAI_API_KEY` and `AUTH_SECRET`
  - Document the full project directory structure with a brief description of each key folder and file
  - Document all required environment variables and their purpose
  - Add screenshots of the editor split-screen view and a rendered public portfolio page
  - _Requirements: (non-functional developer documentation)_


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for full traceability
- Property tests (using `fast-check`) validate universal correctness invariants; unit tests cover specific examples and edge cases
- Checkpoints ensure incremental validation after each logical phase
- The design's Task 16 (README) is renumbered as Task 17 here to accommodate the checkpoint at Task 16

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["4.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "6.1", "6.2", "7.1", "7.2", "8.1", "8.2", "9.1", "9.2", "10.1", "10.2", "11.1", "11.2", "12.1"] },
    { "id": 5, "tasks": ["13.1", "13.2"] },
    { "id": 6, "tasks": ["14.1"] },
    { "id": 7, "tasks": ["15.1", "15.2"] },
    { "id": 8, "tasks": ["17"] }
  ]
}
```
