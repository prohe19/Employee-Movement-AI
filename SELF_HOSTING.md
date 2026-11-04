# Self-Hosting Guide

Run the whole app (web UI + API + PostgreSQL + the Chromium PDF engine) on your own
machine with Docker. Everything stays local and free.

## Prerequisites
- **Docker** with Docker Compose
  - Windows: Docker Desktop (with the WSL2 backend)
  - Linux: `docker` + the `docker compose` plugin
- This repository cloned onto the machine.

## First run (fresh database)

```bash
# 1. From the repo root, create your env file
cp .env.example .env

# 2. Edit .env:
#    - JWT_SECRET      → a long random string:  openssl rand -hex 32
#    - POSTGRES_PASSWORD → pick a password
#    - SEED_ON_START=true   (just for this first boot — creates the admin user)

# 3. Build and start
docker compose up -d --build
```

Give it ~1 minute (first build pulls images + installs Chromium). Then open
**http://localhost:4000** and log in with the admin credentials from `.env`
(`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

**Then turn seeding off** so it doesn't re-seed on every restart:

```bash
# set SEED_ON_START=false in .env, then:
docker compose up -d
```

## See the dashboard with demo data (optional)

The dashboard (flows, site map, promotions, trends) only comes alive once there's
movement data. To load a rich demo set (~45 sample announcements across 12 months):

```bash
docker compose exec app npm run seed:demo
```

Remove it again any time (your real data is untouched):

```bash
docker compose exec app npm run seed:demo -- --clear
```

## Letting your team reach it

| Who | How |
|---|---|
| **Just this machine** | `http://localhost:4000` |
| **Others on the same network (LAN)** | Find this machine's IP (`ipconfig` on Windows, `ip addr` on Linux), set `APP_URL=http://<that-ip>:4000` in `.env`, keep `COOKIE_SECURE=false`, `docker compose up -d`. Team opens `http://<that-ip>:4000`. Allow port **4000** through the OS firewall. |
| **Remote / over the internet** | Put an HTTPS tunnel in front — **Tailscale** (private, best for HR data) or **Cloudflare Tunnel** (free public URL). When served over **HTTPS**, set `COOKIE_SECURE=true` and `APP_URL` to the HTTPS URL. |

> Login uses a session cookie. Over plain HTTP it only works on `localhost` unless
> `COOKIE_SECURE=false` — which is why the LAN setup needs that flag.

## Updating to the latest version

```bash
git pull
docker compose up -d --build
```

Database migrations run automatically on boot (`prisma migrate deploy`), so new
features that add columns/tables just work. Your data in the volumes is untouched.

## Backups (do this regularly — it's employee data)

```bash
# Back up the database
docker compose exec -T db pg_dump -U postgres employee_movement_ai > backup-$(date +%F).sql

# Restore it
cat backup-YYYY-MM-DD.sql | docker compose exec -T db psql -U postgres employee_movement_ai
```

Generated PDFs/PNGs and uploaded photos live in the `uploads` volume; the database
is in the `pgdata` volume. Both survive restarts, rebuilds, and `docker compose down`.

## Handy commands

```bash
docker compose logs -f app     # watch the app logs
docker compose ps              # status
docker compose restart app     # restart just the app
docker compose down            # stop everything (data is kept in the volumes)
docker compose down -v         # stop AND delete the data volumes (destructive!)
```

## Keeping it available
The app is up only while this machine is **on and awake**. On a laptop, disable
sleep while it's serving. `restart: unless-stopped` in the compose file brings the
containers back automatically after a reboot or a Docker restart.
