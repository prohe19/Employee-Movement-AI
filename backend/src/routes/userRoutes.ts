import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { toPublicUser } from "../services/authService";
import { ApiError } from "../lib/errors";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ users: users.map(toPublicUser) });
  })
);

const updateRoleSchema = z.object({ role: z.enum(["hr_user", "admin"]) });

router.patch(
  "/:id/role",
  asyncHandler(async (req, res) => {
    const { role } = updateRoleSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("User not found");
    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    res.json({ user: toPublicUser(user) });
  })
);

export default router;
