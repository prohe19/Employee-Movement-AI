import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";

const router = Router();
router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const signatories = await prisma.signatory.findMany({ orderBy: { jsMin: "asc" } });
    res.json({ signatories });
  })
);

const createSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  jsMin: z.number().int().optional().nullable(),
  jsMax: z.number().int().optional().nullable(),
  signatureImageUrl: z.string().optional().nullable(),
});

router.post(
  "/",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    const signatory = await prisma.signatory.create({ data: input });
    res.status(201).json({ signatory });
  })
);

const updateSchema = createSchema.partial().extend({ isActive: z.boolean().optional() });

router.patch(
  "/:id",
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const input = updateSchema.parse(req.body);
    const existing = await prisma.signatory.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Signatory not found");
    const signatory = await prisma.signatory.update({ where: { id: req.params.id }, data: input });
    res.json({ signatory });
  })
);

export default router;
