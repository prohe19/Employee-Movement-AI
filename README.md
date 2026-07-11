# Employee Movement Announcement Generator

An internal HR web app for **ITM HR Communication** that turns an approved employee movement form
(Transfer, Assignment, Rotation, etc.) into an official announcement letter PDF on the ITM
letterhead.

**Flow:** Upload form → AI extracts fields → HR reviews/edits → app auto-picks narration & signatory →
live A4 letter preview → generate PDF → saved to records.

This repository contains two apps:

| App | Path | Stack |
| --- | --- | --- |
| **Backend API** | [`backend/`](backend/) | Node.js + TypeScript, Express, Prisma/PostgreSQL, Claude (AI extraction), Puppeteer (PDF) |
| **Frontend** | [`frontend/`](frontend/) | React + TypeScript + Vite, the "Neon Drive" themed UI |

## Quick start

Run the backend and frontend in two terminals.

### 1. Backend

```bash
cd backend
cp .env.example .env          # set DATABASE_URL, JWT_SECRET, (optional) ANTHROPIC_API_KEY & GOOGLE_CLIENT_ID
npm install
npm run prisma:migrate        # create the schema
npm run seed                  # default signatories, template, settings, admin user
npm run dev                   # http://localhost:4000
```

`npm run seed` prints a generated admin login (`admin@itmg.co.id` / `ChangeMe123!` by default —
change it). Without `ANTHROPIC_API_KEY`, AI extraction returns a deterministic mock so the whole
flow is runnable offline. See [`backend/README.md`](backend/README.md) for the full API reference and
business-rule notes.

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_BASE_URL defaults to /api (proxied to the backend in dev)
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:4000`, so cookies stay same-origin. Sign in
with the seeded admin account to reach the dashboard, create flow, records, templates, signatories,
and settings.

## What's implemented

- **Auth** — email/password + Google OAuth, JWT httpOnly-cookie sessions, `hr_user` / `admin` roles.
- **AI extraction** — uploads a movement form (PDF/image) and extracts the announcement fields with
  per-field confidence (`high | review | missing`); mock fallback when no API key is set.
- **Business rules** — narration engine (date-aware tense), signatory resolution (highest current JS
  vs. configurable ranges), full server-side validation, configurable announcement numbering.
- **PDF** — the official ITM letterhead rendered to A4 via Puppeteer; the app's neon theme never
  touches the generated letter.
- **UI** — the approved Neon Drive design: Login, Sign Up, the 5-step Create wizard, Dashboard,
  Records, Templates, Signatories, and Settings.

Both apps pass `npm run build` / typecheck, and the end-to-end flow (upload → extract → create →
validate → generate PDF) has been verified against a live PostgreSQL database.
