import "dotenv/config";

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (v === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  appUrl: process.env.APP_URL ?? "http://localhost:4000",
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",

  databaseUrl: process.env.DATABASE_URL ?? "",

  jwtSecret: required("JWT_SECRET", "dev-only-insecure-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  cookieName: process.env.COOKIE_NAME ?? "emai_session",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",

  storageDriver: (process.env.STORAGE_DRIVER as "local" | "s3") ?? "local",
  localStorageDir: process.env.LOCAL_STORAGE_DIR ?? "./uploads",
  publicUploadsBaseUrl:
    process.env.PUBLIC_UPLOADS_BASE_URL ?? "http://localhost:4000/uploads",

  s3: {
    endpoint: process.env.S3_ENDPOINT ?? "",
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: process.env.S3_BUCKET ?? "",
    accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
  },

  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5",

  // Absolute path to a built frontend (dist). When set and present, the API
  // also serves the web UI, so the whole app deploys as a single service.
  frontendDist: process.env.FRONTEND_DIST ?? "",

  // Path to a Chromium/Chrome executable for Puppeteer. Set in Docker/production
  // where Chromium is installed via the system package manager.
  puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? "",

  isProduction: process.env.NODE_ENV === "production",
};
