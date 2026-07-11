#!/bin/sh
set -e

# Apply any pending database migrations before starting the server.
echo "Running database migrations…"
npx prisma migrate deploy

# Optionally seed default data (signatories, template, settings, admin user)
# on first boot. Set SEED_ON_START=true to enable.
if [ "$SEED_ON_START" = "true" ]; then
  echo "Seeding default data…"
  npx tsx prisma/seed.ts || echo "Seed skipped or already applied."
fi

echo "Starting server…"
exec node dist/index.js
