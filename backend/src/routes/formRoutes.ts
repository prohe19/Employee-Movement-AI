import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../lib/errors";
import { prisma } from "../lib/prisma";
import { runExtraction, uploadMovementForm } from "../services/movementFormService";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();
router.use(requireAuth);

router.post(
  "/",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No file uploaded (expected multipart field \"file\")");
    const form = await uploadMovementForm({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ form });
  })
);

const linkSchema = z.object({ announcementId: z.string().uuid() });

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { announcementId } = linkSchema.parse(req.body);
    const form = await prisma.movementForm.update({
      where: { id: req.params.id },
      data: { announcementId },
    });
    res.json({ form });
  })
);

router.post(
  "/:id/extract",
  asyncHandler(async (req, res) => {
    const result = await runExtraction(req.params.id);
    res.json(result);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const form = await prisma.movementForm.findUnique({ where: { id: req.params.id } });
    if (!form) throw ApiError.notFound("Movement form not found");
    res.json({ form });
  })
);

export default router;
