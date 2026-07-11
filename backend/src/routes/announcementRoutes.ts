import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import {
  createAnnouncementSchema,
  listAnnouncementsQuerySchema,
  updateAnnouncementSchema,
} from "../types/dto";
import {
  createAnnouncement,
  getAnnouncement,
  listAnnouncements,
  narrateAnnouncement,
  resolveSignatoryForAnnouncement,
  updateAnnouncement,
  validateAnnouncementById,
} from "../services/announcementService";
import { generateAnnouncementPdf } from "../services/generatePdfService";

const router = Router();
router.use(requireAuth);

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

export default router;
