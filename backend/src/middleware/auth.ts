import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { ApiError } from "../lib/errors";
import { verifyToken } from "../services/authService";
import type { Role } from "@prisma/client";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; role: Role };
    }
  }
}

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[env.cookieName];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next(ApiError.unauthorized("Authentication required"));
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };
}
