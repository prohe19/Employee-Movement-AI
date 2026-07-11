import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import {
  loginWithGoogle,
  loginWithPassword,
  signToken,
  signup,
  toPublicUser,
} from "../services/authService";
import { logActivity } from "../services/activityLogService";

const router = Router();

const cookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: "lax" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

function setSessionCookie(res: import("express").Response, token: string) {
  res.cookie(env.cookieName, token, cookieOptions);
}

const signupSchema = z
  .object({
    fullName: z.string().min(1).max(200),
    username: z
      .string()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, . _ -"),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const input = signupSchema.parse(req.body);
    const user = await signup(input);
    const token = signToken(user);
    setSessionCookie(res, token);
    await logActivity({ userId: user.id, action: "signup", entity: "user", entityId: user.id });
    res.status(201).json({ user: toPublicUser(user), token });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await loginWithPassword(email, password);
    const token = signToken(user);
    setSessionCookie(res, token);
    await logActivity({ userId: user.id, action: "login", entity: "user", entityId: user.id });
    res.json({ user: toPublicUser(user), token });
  })
);

const googleSchema = z.object({
  idToken: z.string().min(1),
});

router.post(
  "/google",
  asyncHandler(async (req, res) => {
    const { idToken } = googleSchema.parse(req.body);
    const user = await loginWithGoogle(idToken);
    const token = signToken(user);
    setSessionCookie(res, token);
    await logActivity({ userId: user.id, action: "login_google", entity: "user", entityId: user.id });
    res.json({ user: toPublicUser(user), token });
  })
);

router.post("/logout", (_req, res) => {
  res.clearCookie(env.cookieName, { path: "/" });
  res.status(204).send();
});

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound("User not found");
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
