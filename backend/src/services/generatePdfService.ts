import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getAnnouncement, validateAnnouncementById } from "./announcementService";
import { renderLetterPdf } from "./pdfService";
import { getStorageDriver } from "./storage";
import { logActivity } from "./activityLogService";

export async function generateAnnouncementPdf(id: string, userId: string) {
  const report = await validateAnnouncementById(id);
  if (!report.valid) {
    throw ApiError.badRequest("Announcement is not ready to generate", { rules: report.rules });
  }

  const announcement = await getAnnouncement(id);
  if (!announcement.signatory) {
    throw ApiError.badRequest("Signatory could not be resolved for this announcement");
  }

  const companyName =
    announcement.employees[0]?.newCompany ??
    announcement.employees[0]?.currentCompany ??
    "PT Indo Tambangraya Megah, Tbk";

  const narrationLines = (announcement.narrationText ?? "")
    .split("\n")
    .map((l) => l.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  const pdfBuffer = await renderLetterPdf({
    announcementNumber: announcement.number,
    movementType: announcement.movementType,
    companyName,
    narrationLines,
    effectiveSentence: announcement.effectiveSentence ?? "",
    city: announcement.city,
    announcementDate: announcement.announcementDate,
    signatoryName: announcement.signatory.name,
    signatoryTitle: announcement.signatory.title,
    signatureImageUrl: announcement.signatory.signatureImageUrl,
    letterheadKey: announcement.letterheadKey,
  });

  const storage = getStorageDriver();
  const key = `announcements/${announcement.id}/${Date.now()}.pdf`;
  const stored = await storage.save({
    buffer: pdfBuffer,
    key,
    contentType: "application/pdf",
  });

  const updated = await prisma.announcement.update({
    where: { id },
    data: { pdfUrl: stored.url, status: "Finalized" },
    include: { employees: true, signatory: true, template: true },
  });

  await logActivity({
    userId,
    action: "generate_pdf",
    entity: "announcement",
    entityId: id,
    metadata: { pdfUrl: stored.url },
  });

  return updated;
}
