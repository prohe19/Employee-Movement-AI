import { randomUUID } from "node:crypto";
import path from "node:path";
import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { ApiError } from "../lib/errors";
import {
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  updateAnnouncementSchema,
} from "../types/dto";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncement,
  listAnnouncements,
  narrateAnnouncement,
  resolveSignatoryForAnnouncement,
  updateAnnouncement,
  validateAnnouncementById,
} from "../services/announcementService";
import { generateAnnouncementPdf } from "../services/generatePdfService";
import { generateAnnouncementEmailImage } from "../services/generateEmailImageService";
import { getStorageDriver } from "../services/storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const PHOTO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

const router = Router();
router.use(requireAuth);

router.post(
  "/photo",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest("No photo uploaded (expected multipart field \"file\")");
    const ext = PHOTO_EXT[req.file.mimetype];
    if (!ext) throw ApiError.badRequest("Photo must be a JPEG, PNG, or WebP image.");
    const storage = getStorageDriver();
    const key = `photos/${randomUUID()}${ext || path.extname(req.file.originalname)}`;
    const stored = await storage.save({
      buffer: req.file.buffer,
      key,
      contentType: req.file.mimetype,
    });
    res.status(201).json({ url: stored.url, key: stored.key });
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = listAnnouncementsQuerySchema.parse(req.query);
    const result = await listAnnouncements(query);
    res.json(result);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = createAnnouncementSchema.parse(req.body);
    const announcement = await createAnnouncement(req.user!.id, input);
    res.status(201).json({ announcement });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const announcement = await getAnnouncement(req.params.id);
    res.json({ announcement });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = updateAnnouncementSchema.parse(req.body);
    const announcement = await updateAnnouncement(req.params.id, req.user!.id, input);
    res.json({ announcement });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteAnnouncement(req.params.id, req.user!.id);
    res.status(204).end();
  })
);

router.post(
  "/:id/narrate",
  asyncHandler(async (req, res) => {
    const result = await narrateAnnouncement(req.params.id);
    res.json(result);
  })
);

router.post(
  "/:id/resolve-signatory",
  asyncHandler(async (req, res) => {
    const result = await resolveSignatoryForAnnouncement(req.params.id);
    res.json(result);
  })
);

router.post(
  "/:id/validate",
  asyncHandler(async (req, res) => {
    const report = await validateAnnouncementById(req.params.id);
    res.json(report);
  })
);

router.post(
  "/:id/generate-pdf",
  asyncHandler(async (req, res) => {
    const announcement = await generateAnnouncementPdf(req.params.id, req.user!.id);
    res.json({ announcement });
  })
);

router.post(
  "/:id/generate-email",
  asyncHandler(async (req, res) => {
    const announcement = await generateAnnouncementEmailImage(req.params.id, req.user!.id);
    res.json({ announcement });
  })
);

export default router;
