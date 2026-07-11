import { PDFDocument } from "pdf-lib";
import { v4 as uuid } from "uuid";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getStorageDriver } from "./storage";
import { extractMovementForm } from "./extractionService";
import { logActivity } from "./activityLogService";
import type { ExtractionResult } from "../types/extraction";

const ALLOWED_MIME_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/webp"]);

async function getPageCount(buffer: Buffer, mimeType: string): Promise<number | undefined> {
  if (mimeType !== "application/pdf") return 1;
  try {
    const doc = await PDFDocument.load(buffer, { updateMetadata: false });
    return doc.getPageCount();
  } catch {
    return undefined;
  }
}

export async function uploadMovementForm(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  uploadedBy: string;
}) {
  if (!ALLOWED_MIME_TYPES.has(input.mimeType)) {
    throw ApiError.badRequest(
      `Unsupported file type "${input.mimeType}". Upload a PDF, PNG, JPEG, or WebP.`
    );
  }

  const extension = input.originalName.includes(".")
    ? input.originalName.slice(input.originalName.lastIndexOf("."))
    : "";
  const key = `movement-forms/${uuid()}${extension}`;

  const storage = getStorageDriver();
  const stored = await storage.save({
    buffer: input.buffer,
    key,
    contentType: input.mimeType,
  });

  const pageCount = await getPageCount(input.buffer, input.mimeType);

  const form = await prisma.movementForm.create({
    data: {
      fileUrl: stored.url,
      storageKey: key,
      mimeType: input.mimeType,
      fileName: input.originalName,
      fileSize: input.buffer.length,
      pageCount,
      uploadedBy: input.uploadedBy,
    },
  });

  await logActivity({
    userId: input.uploadedBy,
    action: "upload_form",
    entity: "movement_form",
    entityId: form.id,
  });

  return form;
}

export async function runExtraction(formId: string) {
  const form = await prisma.movementForm.findUnique({ where: { id: formId } });
  if (!form) throw ApiError.notFound("Movement form not found");

  const storage = getStorageDriver();
  const buffer = await storage.load(form.storageKey);

  const result: ExtractionResult = await extractMovementForm(buffer, form.mimeType);

  await prisma.movementForm.update({
    where: { id: formId },
    data: {
      extractionJson: result as unknown as object,
      extractionConfidence: result.overallConfidence,
      reviewStatus: "pending",
    },
  });

  return result;
}
