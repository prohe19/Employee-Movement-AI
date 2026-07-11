import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(requireAuth);

async function getOrCreateSettings() {
  const existing = await prisma.setting.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  return prisma.setting.create({ data: { id: 1 } });
}

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const settings = await getOrCreateSettings();
    res.json({ settings });
  })
);

const updateSchema = z.object({
  numberingFormat: z.string().min(1).optional(),
  defaultCity: z.string().min(1).optional(),
  defaultCompany: z.string().min(1).optional(),
  defaultTemplateId: z.string().uuid().optional().nullable(),
  dateFormat: z.string().min(1).optional(),
  retentionPolicy: z.string().optional().nullable(),
});

router.patch(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    await getOrCreateSettings();
    const settings = await prisma.setting.update({ where: { id: 1 }, data: input });
    res.json({ settings });
  })
);

export default router;
