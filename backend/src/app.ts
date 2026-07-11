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

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/auth", authRoutes);
  app.use("/announcements", announcementRoutes);
  app.use("/forms", formRoutes);
  app.use("/templates", templateRoutes);
  app.use("/signatories", signatoryRoutes);
  app.use("/settings", settingsRoutes);
  app.use("/users", userRoutes);
  app.use("/dashboard", dashboardRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
