import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import { transferFormSchema } from "../types/dto";
import {
  createTransferForm,
  deleteTransferForm,
  generateTransferFormPdf,
  getTransferForm,
  listTransferForms,
  updateTransferForm,
} from "../services/transferFormService";

const router = Router();
router.use(requireAuth);

const listQuery = z.object({ search: z.string().optional() });

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = listQuery.parse(req.query);
    const forms = await listTransferForms(search);
    res.json({ forms });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = transferFormSchema.parse(req.body);
    const form = await createTransferForm(req.user!.id, input);
    res.status(201).json({ form });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const form = await getTransferForm(req.params.id);
    res.json({ form });
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = transferFormSchema.parse(req.body);
    const form = await updateTransferForm(req.params.id, req.user!.id, input);
    res.json({ form });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteTransferForm(req.params.id, req.user!.id);
    res.status(204).end();
  })
);

router.post(
  "/:id/generate-pdf",
  asyncHandler(async (req, res) => {
    const form = await generateTransferFormPdf(req.params.id, req.user!.id);
    res.json({ form });
  })
);

export default router;
