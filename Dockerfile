# ---------- Stage 1: build the frontend ----------
FROM node:22-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
# Same-origin API calls in the single-service deployment (backend serves the UI).
ENV VITE_API_BASE_URL=""
RUN npm run build

# ---------- Stage 2: build the backend ----------
FROM node:22-slim AS backend
WORKDIR /app/backend
# Puppeteer's bundled Chromium isn't used at runtime (we install system Chromium),
# so skip the large download during install.
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate && npm run build

# ---------- Stage 3: runtime ----------
FROM node:22-slim AS runtime
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Chromium + the fonts/libs Puppeteer needs to render the letter PDF.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     chromium \
     fonts-liberation \
     ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Backend build output, dependencies (incl. Prisma CLI + generated client), schema & assets.
COPY --from=backend /app/backend/node_modules ./node_modules
COPY --from=backend /app/backend/dist ./dist
COPY --from=backend /app/backend/package.json ./package.json
COPY --from=backend /app/backend/prisma ./prisma
COPY --from=backend /app/backend/assets ./assets

# Built frontend, served by the API.
COPY --from=frontend /app/frontend/dist /app/frontend/dist
ENV FRONTEND_DIST=/app/frontend/dist

# Uploaded forms + generated PDFs (local storage driver). Mount a volume here to persist.
RUN mkdir -p /app/backend/uploads
ENV LOCAL_STORAGE_DIR=/app/backend/uploads

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["docker-entrypoint.sh"]
