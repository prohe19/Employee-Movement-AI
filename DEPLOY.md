# Deploying the Employee Movement Announcement Generator

This guide gets the whole app online at a web link your team can use. The app is packaged to
deploy as **one service** (the website, the API, and the PDF engine together) plus **one
PostgreSQL database**. The included `Dockerfile` handles the tricky parts (including the headless
Chromium used to render the PDF), so the hosting platform just builds and runs it.

We use **[Railway](https://railway.app)** below because it hosts the app *and* the database in one
place. Any host that can build a `Dockerfile` and provide a PostgreSQL database works the same way
(Render, Fly.io, etc.).

---

## Before you start

You'll need:

- The GitHub repository (this repo) — you already have it.
- A **Railway** account (sign up with your GitHub account — it's the smoothest).
- ~**$5/month** for an always-on app + database (Railway isn't free for always-on, but it's cheap).
- *(Optional, for real AI extraction)* an **Anthropic API key** from <https://console.anthropic.com>.
  Without it, the app still works but uses built-in sample extraction data.
- *(Optional, for "Sign in with Google")* a **Google OAuth client ID**.

---

## Step-by-step (Railway)

### 1. Create the project from your repo

1. Go to <https://railway.app> and **Log in with GitHub**.
2. Click **New Project** → **Deploy from GitHub repo**.
3. Authorize Railway to see your repos if asked, then pick **`Employee-Movement-AI`**.
4. Railway detects the `Dockerfile` and starts building. Let it build — it will fail to start the
   first time because there's no database yet. That's expected; continue below.

### 2. Add the PostgreSQL database

1. In your project, click **New** (or **+ Create**) → **Database** → **Add PostgreSQL**.
2. Railway creates a database and a `DATABASE_URL` for it.

### 3. Connect the database + set the required variables

1. Click your **app service** (not the database) → **Variables** tab.
2. Add these variables:

   | Variable | Value |
   | --- | --- |
   | `DATABASE_URL` | Reference the Postgres one. In Railway, type `${{Postgres.DATABASE_URL}}` (this auto-links to the database you just created). |
   | `JWT_SECRET` | A long random string (e.g. mash your keyboard, 30+ characters). Keep it secret. |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | Your app's public URL (fill this in after Step 4, e.g. `https://your-app.up.railway.app`). |
   | `SEED_ON_START` | `true` — only for the **first** deploy; it creates the default signatories, template, and an admin login. Set it back to `false` (or remove it) after the first successful boot. |

3. *(Optional)* Add `ANTHROPIC_API_KEY` for real AI extraction, and `GOOGLE_CLIENT_ID` for Google
   sign-in.

### 4. Expose the app to the internet

1. Click your app service → **Settings** → **Networking** → **Generate Domain**.
2. Railway gives you a URL like `https://your-app.up.railway.app`. That's your website link.
3. Go back to **Variables** and set `CORS_ORIGIN` to that exact URL, then let it redeploy.

### 5. First login

1. Open your new URL. You should see the login screen.
2. Sign in with the seeded admin account (from `backend/prisma/seed.ts`):
   - **Email:** `admin@itmg.co.id`
   - **Password:** `ChangeMe123!`
3. **Change or remove this default account immediately** for a real deployment. You can create your
   own accounts via **Sign up**, and an admin can promote a user to `admin` via the API
   (`PATCH /users/:id/role`).
4. After the first successful boot, set `SEED_ON_START` to `false` so it doesn't try to re-seed.

---

## Environment variables reference

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | PostgreSQL connection string. |
| `JWT_SECRET` | ✅ | Signs login sessions. Use a long random secret. |
| `NODE_ENV` | ✅ | Set to `production`. |
| `CORS_ORIGIN` | ✅ | Your app's public URL (for cookie/CORS safety). |
| `SEED_ON_START` | first boot | `true` once to seed defaults, then turn off. |
| `PORT` | auto | Railway sets this; the app reads it. |
| `ANTHROPIC_API_KEY` | optional | Enables real AI form extraction (mock data if unset). |
| `ANTHROPIC_MODEL` | optional | Defaults to `claude-sonnet-5`. |
| `GOOGLE_CLIENT_ID` | optional | Enables "Sign in with Google". |
| `FRONTEND_DIST` | preset | Set by the Docker image; don't change. |
| `PUPPETEER_EXECUTABLE_PATH` | preset | Set by the Docker image; don't change. |

## Notes on file storage

By default the app stores uploaded forms and generated PDFs on the container's local disk. On most
platforms that disk is **ephemeral** (wiped on redeploy). For durable storage, attach a persistent
volume mounted at `/app/backend/uploads`, or switch to S3-compatible storage by setting
`STORAGE_DRIVER=s3` and the `S3_*` variables (see `backend/.env.example`).

## Running the Docker image yourself (optional)

```bash
docker build -t emai-app .
docker run -p 4000:4000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="a-long-random-secret" \
  -e NODE_ENV=development \
  -e CORS_ORIGIN="http://localhost:4000" \
  -e SEED_ON_START=true \
  emai-app
# then open http://localhost:4000
```

> Note the `NODE_ENV=development` above: login cookies are marked "secure" (HTTPS-only) in
> production, so plain `http://localhost` testing needs `development`. On a real host like Railway
> (which serves your app over HTTPS) use `NODE_ENV=production`.
