# Employee Movement AI — Backend

API for the Employee Movement Announcement Generator (ITM HR Communication). Implements the spec in
`design_handoff_movement_announcement/README.md`: upload an employee movement form → AI extraction →
HR review → narration/signatory engine → validated → generate the official ITM letterhead PDF.

## Stack

Node.js + TypeScript + Express, PostgreSQL + Prisma, JWT (httpOnly cookie) auth with Google OAuth +
email/password, Claude (`@anthropic-ai/sdk`) for document extraction, Puppeteer for HTML→PDF, local
disk or S3-compatible file storage.

## Setup

```bash
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, GOOGLE_CLIENT_ID, ANTHROPIC_API_KEY, ...
npm install
npm run prisma:migrate # creates the schema
npm run seed            # default signatories, template, settings, admin user
npm run dev              # http://localhost:4000
```

`npm run seed` prints the generated admin login — change that password immediately in a real deployment.

### AI extraction without an API key

If `ANTHROPIC_API_KEY` is unset, `POST /forms/:id/extract` returns a deterministic mock extraction
(the sample Lucas Manurung / ITM-F-HR-002 data from the design spec) instead of calling Claude, so the
rest of the flow can be exercised without credentials.

### File storage

`STORAGE_DRIVER=local` (default) writes to `LOCAL_STORAGE_DIR` and serves it from `/uploads`.
Set `STORAGE_DRIVER=s3` plus the `S3_*` variables to use an S3-compatible bucket instead — same
interface (`src/services/storage`), no route changes needed.

## Auth

- `POST /auth/signup` — full name, unique username, unique email, password (min 8 chars, letters +
  numbers), confirmPassword.
- `POST /auth/login` — email + password.
- `POST /auth/google` — `{ idToken }` from Google Identity Services on the frontend.
- `POST /auth/logout`, `GET /auth/me`.

Sessions are an httpOnly JWT cookie (`COOKIE_NAME`); the token is also returned in the JSON body for
clients that prefer `Authorization: Bearer`. Roles: `hr_user`, `admin` (admin manages templates,
signatories, settings, users).

## Core flow endpoints

- `POST /forms` (multipart `file`) → upload a movement form (PDF/PNG/JPEG/WebP).
- `POST /forms/:id/extract` → runs AI extraction, returns fields + per-field confidence
  (`high | review | missing`).
- `PATCH /forms/:id` → link a form to an announcement (`{ announcementId }`).
- `POST /announcements` → create from reviewed fields (auto-generates the announcement number if
  omitted, runs narration/signatory/validation, sets status).
- `GET /announcements`, `GET /announcements/:id`, `PATCH /announcements/:id`.
- `POST /announcements/:id/narrate` — recompute the narration + effective-date sentence.
- `POST /announcements/:id/resolve-signatory` — recompute the signatory from current JS.
- `POST /announcements/:id/validate` — per-rule pass/fail report; blocks PDF until all pass.
- `POST /announcements/:id/generate-pdf` — renders the official ITM letterhead PDF, sets
  `Finalized`.

Admin: `GET/POST/PATCH /templates`, `GET/POST/PATCH /signatories`, `GET/PATCH /settings`,
`GET /users`, `PATCH /users/:id/role`.

`GET /dashboard/summary` — KPI counts, movement-type distribution, recent announcements, upcoming
effective dates, recent extractions (backs the dashboard screen in the design).

## Business rules implemented

- **Narration & tense** (`src/services/narrationService.ts`) — tense is effective date vs.
  *announcement* date (future/present/past), with the temporary/acting-assignment start↔end
  variants and the end-of-assignment sentence, per the spec verbatim templates.
- **Signatory** (`src/services/signatoryService.ts`) — highest *current* JS across employees looked
  up against the `signatories` table's `jsMin`/`jsMax` ranges (seeded as ≤17 → HR Head, >17 →
  President Director); missing/unclear JS blocks generation.
- **Validation** (`src/services/validationService.ts`) — every rule in the spec (number
  present+unique, required employee fields, assignment date ordering, signatory resolved, template
  selected, ...); failing any rule keeps the announcement at `RequiresReview` and blocks
  `generate-pdf`.
- **Numbering** (`src/services/numberingService.ts`) — configurable format in `settings`
  (`{seq}/ A/ ITM/ HR/ {month}/ {year}`), sequence auto-incremented from existing announcement
  numbers.
- **Letter/PDF** (`src/services/letterTemplateService.ts`, `pdfService.ts`) — the official ITM
  letterhead (`assets/letter_memo_2125.png`) as an A4 background with the announcement text
  overlaid via Puppeteer; the app's neon theme never touches the generated PDF.

## Scripts

- `npm run dev` — watch mode.
- `npm run build` / `npm start` — production build/run.
- `npm run typecheck`.
- `npm run prisma:migrate` / `npm run prisma:deploy` — dev/prod migrations.
- `npm run seed`.
