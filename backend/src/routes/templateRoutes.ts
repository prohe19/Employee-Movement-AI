import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { movementTypeEnum } from "../types/dto";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const templates = await prisma.template.findMany({ orderBy: { updatedAt: "desc" } });
    res.json({ templates });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!template) throw ApiError.notFound("Template not found");
    res.json({ template });
  })
);

const createSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  companyScope: z.string().optional().nullable(),
  movementTypeScope: movementTypeEnum.optional().nullable(),
  fileUrl: z.string().optional().nullable(),
  placeholders: z.record(z.unknown()).optional(),
});

router.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const template = await prisma.template.create({
      data: { ...input, placeholders: input.placeholders as Prisma.InputJsonValue | undefined },
    });
    res.status(201).json({ template });
  })
);

const updateSchema = createSchema.partial().extend({
  isActive: z.boolean().optional(),
  bumpVersion: z.boolean().optional(),
});

router.patch(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { bumpVersion, ...input } = updateSchema.parse(req.body);
    const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Template not found");
    const template = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...input,
        placeholders: input.placeholders as Prisma.InputJsonValue | undefined,
        version: bumpVersion ? existing.version + 1 : undefined,
      },
    });
    res.json({ template });
  })
);

export default router;
