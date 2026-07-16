import path from "node:path";
import type { AnnouncementEmployee } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { getAnnouncement } from "./announcementService";
import { buildEmailImageHtml, emailCategory, type EmailEmployeeInput } from "./emailTemplateService";
import { renderHtmlToPng } from "./pdfService";
import { getStorageDriver } from "./storage";
import { logActivity } from "./activityLogService";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Loads a stored photo and returns it as a data URI for inlining into the render HTML. */
async function photoDataUri(employee: AnnouncementEmployee): Promise<string> {
  if (!employee.photoKey) {
    throw ApiError.badRequest(`${employee.employeeName}: an employee photo is required for the email image.`);
  }
  const storage = getStorageDriver();
  const buffer = await storage.load(employee.photoKey);
  const mime = MIME_BY_EXT[path.extname(employee.photoKey).toLowerCase()] ?? "image/jpeg";
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

export async function generateAnnouncementEmailImage(id: string, userId: string) {
  const announcement = await getAnnouncement(id);

  if (!emailCategory(announcement.movementType)) {
    throw ApiError.badRequest(
      "Email images are available for transfers and assignments only. This movement type is not supported yet."
    );
  }
  if (announcement.employees.length === 0) {
    throw ApiError.badRequest("At least one employee is required to generate the email image.");
  }
  if (announcement.employees.length > 3) {
    throw ApiError.badRequest("An announcement email supports at most three employees.");
  }

  const employees: EmailEmployeeInput[] = await Promise.all(
    announcement.employees.map(async (e) => ({
      title: e.title,
      employeeName: e.employeeName,
      currentPosition: e.currentPosition,
      currentDepartment: e.currentDepartment,
      currentLocation: e.currentLocation,
      currentCompany: e.currentCompany,
      newPosition: e.newPosition,
      newDepartment: e.newDepartment,
      newLocation: e.newLocation,
      newCompany: e.newCompany,
      effectiveDate: e.effectiveDate,
      assignmentStartDate: e.assignmentStartDate,
      assignmentEndDate: e.assignmentEndDate,
      photoDataUri: await photoDataUri(e),
    }))
  );

  const { html } = buildEmailImageHtml({
    movementType: announcement.movementType,
    employees,
    announcementDate: announcement.announcementDate,
  });

  const pngBuffer = await renderHtmlToPng(html, 1280, 720);

  const storage = getStorageDriver();
  const key = `announcements/${announcement.id}/email-${Date.now()}.png`;
  const stored = await storage.save({ buffer: pngBuffer, key, contentType: "image/png" });

  const updated = await prisma.announcement.update({
    where: { id },
    data: { emailImageUrl: stored.url },
    include: { employees: true, signatory: true, template: true },
  });

  await logActivity({
    userId,
    action: "generate_email_image",
    entity: "announcement",
    entityId: id,
    metadata: { emailImageUrl: stored.url },
  });

  return updated;
}
