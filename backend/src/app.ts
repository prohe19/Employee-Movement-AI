import fs from "node:fs";
import path from "node:path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/authRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import formRoutes from "./routes/formRoutes";
import templateRoutes from "./routes/templateRoutes";
import signatoryRoutes from "./routes/signatoryRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import userRoutes from "./routes/userRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") {
    app.use(morgan(env.isProduction ? "combined" : "dev"));
  }

  if (env.storageDriver === "local") {
    app.use("/uploads", express.static(path.resolve(env.localStorageDir)));
  }

  // Static assets (e.g. the official ITM letterhead used by the letter preview).
  app.use("/assets", express.static(path.resolve(__dirname, "..", "assets")));

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRoutes);
  app.use("/announcements", announcementRoutes);
  app.use("/forms", formRoutes);
  app.use("/templates", templateRoutes);
  app.use("/signatories", signatoryRoutes);
  app.use("/settings", settingsRoutes);
  app.use("/users", userRoutes);
  app.use("/dashboard", dashboardRoutes);

  // Single-service deployment: serve the built frontend and fall back to
  // index.html for client-side routes. Enabled when FRONTEND_DIST points at a
  // built frontend (e.g. in the Docker image / production).
  const frontendDist = env.frontendDist;
  if (frontendDist && fs.existsSync(path.join(frontendDist, "index.html"))) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      // Let unmatched API/asset routes 404 as JSON instead of returning the SPA.
      if (
        req.path.startsWith("/uploads") ||
        req.path.startsWith("/assets") ||
        req.method !== "GET"
      ) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
