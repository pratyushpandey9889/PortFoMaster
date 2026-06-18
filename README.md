[README.md](https://github.com/user-attachments/files/29089819/README.md)
# Portfolio Website Builder

A full-stack web application where users can create, customize, and share personal portfolio websites — no coding required.

## What it does

Sign up, fill out a guided form with your professional details (name, bio, skills, projects, work experience, education, social links), pick a theme, and get a beautiful shareable portfolio page at a unique public URL like `yourapp.com/p/username`.

## Features

- **Auth system** — Sign up / log in with email and password
- **Portfolio editor** — Step-by-step form with live split-screen preview
- **AI-generated bio** — Click "Generate Bio" to get a professional summary written by AI (powered by OpenAI GPT-4o-mini)
- **3 visual themes** — Minimal, Dark, and Creative — switch themes and see live preview instantly
- **Shareable public link** — Every portfolio gets a unique URL (`/p/username`) accessible without login
- **Auto-save** — Changes are saved automatically every 30 seconds

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | SQLite via Prisma ORM |
| Auth | NextAuth.js v5 (Auth.js) |
| AI | OpenAI API (gpt-4o-mini) |
| File storage | Local filesystem (`/public/uploads/`) |

## Prerequisites

- Node.js 18+ 
- npm 9+

## Local Setup

### 1. Clone and install dependencies

```bash
git clone <your-repo-url>
cd portfolio-builder
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
# Required: Generate a random secret (e.g. run: openssl rand -base64 32)
AUTH_SECRET=your-random-secret-here

# Required: Your app URL (use this for local dev)
NEXTAUTH_URL=http://localhost:3000

# Required: Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Set up the database

Run the database migration to create the SQLite database file:

```bash
npx prisma migrate dev
```

Optionally seed a test user (email: `test@example.com`, password: `testpassword123`, username: `testuser`):

```bash
npm run db:seed
```

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
portfolio-builder/
├── app/                        # Next.js App Router pages and API routes
│   ├── api/                    # API route handlers
│   │   ├── auth/               # NextAuth + custom register endpoint
│   │   ├── bio/generate/       # AI bio generation
│   │   └── portfolio/          # Portfolio CRUD + skills/experience/etc.
│   ├── editor/                 # Protected portfolio editor page
│   ├── login/                  # Login page
│   ├── p/[username]/           # Public portfolio page (SSR)
│   └── register/               # Registration page
├── src/
│   ├── components/
│   │   ├── editor/             # Editor form sections + preview
│   │   ├── themes/             # MinimalTheme, DarkTheme, CreativeTheme
│   │   └── ui/                 # Shared UI components (Notification, etc.)
│   ├── hooks/                  # usePortfolio custom hook
│   ├── lib/                    # Prisma singleton, validators
│   └── types/                  # TypeScript DTO interfaces
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Test data seeder
│   └── dev.db                  # SQLite database file (auto-generated)
├── public/
│   └── uploads/                # User-uploaded profile photos
├── auth.ts                     # NextAuth full config (Node.js runtime)
├── auth.config.ts              # NextAuth edge-safe config (for middleware)
└── proxy.ts                    # Next.js 16 middleware (route protection)
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | Yes | Random secret for signing JWT session tokens. Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Full URL of your app (e.g., `http://localhost:3000` or your production URL) |
| `OPENAI_API_KEY` | Yes | OpenAI API key for the "Generate Bio" feature. Get one at [platform.openai.com](https://platform.openai.com/api-keys) |

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server at http://localhost:3000 |
| `npm run build` | Build the production bundle |
| `npm run start` | Start the production server |
| `npm test` | Run the property-based test suite |
| `npm run db:seed` | Seed a test user into the database |
| `npx prisma migrate dev` | Apply database migrations |
| `npx prisma studio` | Open Prisma Studio to browse the database |

## Testing

The project uses **Jest** with **fast-check** for property-based testing. The test suite covers 29 correctness properties across all validators and business logic.

```bash
npm test
```

## Deployment

This project deploys easily to **Vercel**:

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add the environment variables (`AUTH_SECRET`, `NEXTAUTH_URL`, `OPENAI_API_KEY`) in the Vercel dashboard
4. Deploy

> **Note:** The SQLite database and local file uploads are not suitable for production at scale. For production, consider migrating to PostgreSQL (update `prisma/schema.prisma` datasource to `postgresql`) and using cloud storage (e.g., AWS S3 or Cloudflare R2) for photo uploads.

## Manual Testing Guide

After setup, here's what to test manually:

### Auth
- Register a new account at `/register`
- Log in at `/login` with wrong credentials — verify generic error message
- Try navigating to `/editor` without being logged in — verify redirect to `/login`

### Portfolio Editor
- Fill in your name, title, location
- Upload a profile photo
- Add skills, work experience, projects, education, social links
- Watch the live preview update in real time on the right
- Switch between Minimal, Dark, and Creative themes
- Click "Save" — verify the success toast appears
- Refresh the page — verify all data persists

### AI Bio Generation
- Fill in your name, professional title, and add at least one skill
- Click "Generate Bio with AI" — verify a bio is generated
- Try generating without name/title/skills — verify error message

### Public Portfolio Page
- Copy your public URL from the editor
- Open it in an incognito window — verify it's accessible without login
- Verify your selected theme is applied

## License

MIT
