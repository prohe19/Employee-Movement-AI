import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import type { Role, User } from "@prisma/client";

export interface AuthTokenPayload {
  sub: string;
  role: Role;
}

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;

const PASSWORD_MIN_LENGTH = 8;

export function assertPasswordPolicy(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    throw ApiError.badRequest(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    );
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    throw ApiError.badRequest("Password must contain both letters and numbers");
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: Pick<User, "id" | "role">): string {
  const payload: AuthTokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}

export async function signup(input: {
  fullName: string;
  username: string;
  email: string;
  password: string;
}): Promise<User> {
  assertPasswordPolicy(input.password);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw ApiError.conflict(
      existing.email === input.email ? "Email already in use" : "Username already in use"
    );
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      fullName: input.fullName,
      username: input.username,
      email: input.email,
      passwordHash,
      role: "hr_user",
    },
  });
}

export async function loginWithPassword(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  return user;
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  if (!googleClient) {
    throw ApiError.badRequest("Google sign-in is not configured on this server");
  }
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });
  const payload = ticket.getPayload();
  if (!payload || !payload.email || !payload.sub) {
    throw ApiError.unauthorized("Invalid Google credential");
  }

  const existingBySub = await prisma.user.findUnique({ where: { googleSub: payload.sub } });
  if (existingBySub) return existingBySub;

  const existingByEmail = await prisma.user.findUnique({ where: { email: payload.email } });
  if (existingByEmail) {
    return prisma.user.update({
      where: { id: existingByEmail.id },
      data: { googleSub: payload.sub },
    });
  }

  const baseUsername = payload.email.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "").toLowerCase();
  let username = baseUsername || `user${Date.now()}`;
  let suffix = 0;
  // eslint-disable-next-line no-constant-condition
  while (await prisma.user.findUnique({ where: { username } })) {
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  return prisma.user.create({
    data: {
      fullName: payload.name || payload.email,
      username,
      email: payload.email,
      googleSub: payload.sub,
      role: "hr_user",
    },
  });
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}
