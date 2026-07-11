import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import type {
  CreateAnnouncementInput,
  EmployeeInput,
  UpdateAnnouncementInput,
} from "../types/dto";
import { generateAnnouncementNumber } from "./numberingService";
import { buildNarration } from "./narrationService";
import { resolveSignatory } from "./signatoryService";
import { validateAnnouncement } from "./validationService";
import { logActivity } from "./activityLogService";

const employeeInclude = { employees: true } satisfies Prisma.AnnouncementInclude;

function employeeCreateData(emp: EmployeeInput): Prisma.AnnouncementEmployeeCreateWithoutAnnouncementInput {
  return {
    employeeName: emp.employeeName,
    employeeId: emp.employeeId ?? undefined,
    movementType: emp.movementType ?? undefined,
    currentPosition: emp.currentPosition ?? undefined,
    newPosition: emp.newPosition ?? undefined,
    currentJs: emp.currentJs ?? undefined,
    newJs: emp.newJs ?? undefined,
    currentDepartment: emp.currentDepartment ?? undefined,
    newDepartment: emp.newDepartment ?? undefined,
    currentDivision: emp.currentDivision ?? undefined,
    newDivision: emp.newDivision ?? undefined,
    currentCostCenter: emp.currentCostCenter ?? undefined,
    newCostCenter: emp.newCostCenter ?? undefined,
    currentCompany: emp.currentCompany ?? undefined,
    newCompany: emp.newCompany ?? undefined,
    currentLocation: emp.currentLocation ?? undefined,
    newLocation: emp.newLocation ?? undefined,
    effectiveDate: emp.effectiveDate ?? undefined,
    assignmentStartDate: emp.assignmentStartDate ?? undefined,
    assignmentEndDate: emp.assignmentEndDate ?? undefined,
  };
}

export async function createAnnouncement(userId: string, input: CreateAnnouncementInput) {
  const announcementDate = input.announcementDate ?? new Date();
  const number = input.number?.trim() || (await generateAnnouncementNumber(announcementDate));

  const existing = await prisma.announcement.findUnique({ where: { number } });
  if (existing) {
    throw ApiError.conflict(`Announcement number "${number}" is already in use`);
  }

  const announcement = await prisma.announcement.create({
    data: {
      number,
      announcementDate,
      city: input.city ?? "Jakarta",
      templateId: input.templateId ?? undefined,
      movementType: input.movementType,
      notes: input.notes ?? undefined,
      createdBy: userId,
      status: "Draft",
      employees: { create: input.employees.map(employeeCreateData) },
    },
    include: employeeInclude,
  });

  await logActivity({
    userId,
    action: "create",
    entity: "announcement",
    entityId: announcement.id,
  });

  return recomputeStatus(announcement.id);
}

export async function updateAnnouncement(
  id: string,
  userId: string,
  input: UpdateAnnouncementInput
) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Announcement not found");

  if (input.number && input.number !== existing.number) {
    const dup = await prisma.announcement.findUnique({ where: { number: input.number } });
    if (dup) throw ApiError.conflict(`Announcement number "${input.number}" is already in use`);
  }

  await prisma.$transaction(async (tx) => {
    await tx.announcement.update({
      where: { id },
      data: {
        number: input.number ?? undefined,
        announcementDate: input.announcementDate ?? undefined,
        city: input.city ?? undefined,
        templateId: input.templateId === undefined ? undefined : input.templateId,
        movementType: input.movementType ?? undefined,
        status: input.status ?? undefined,
        notes: input.notes === undefined ? undefined : input.notes,
        signatoryId: input.signatoryId === undefined ? undefined : input.signatoryId,
      },
    });

    if (input.employees) {
      await tx.announcementEmployee.deleteMany({ where: { announcementId: id } });
      await tx.announcementEmployee.createMany({
        data: input.employees.map((emp) => ({
          announcementId: id,
          employeeName: emp.employeeName,
          employeeId: emp.employeeId ?? null,
          movementType: emp.movementType ?? null,
          currentPosition: emp.currentPosition ?? null,
          newPosition: emp.newPosition ?? null,
          currentJs: emp.currentJs ?? null,
          newJs: emp.newJs ?? null,
          currentDepartment: emp.currentDepartment ?? null,
          newDepartment: emp.newDepartment ?? null,
          currentDivision: emp.currentDivision ?? null,
          newDivision: emp.newDivision ?? null,
          currentCostCenter: emp.currentCostCenter ?? null,
          newCostCenter: emp.newCostCenter ?? null,
          currentCompany: emp.currentCompany ?? null,
          newCompany: emp.newCompany ?? null,
          currentLocation: emp.currentLocation ?? null,
          newLocation: emp.newLocation ?? null,
          effectiveDate: emp.effectiveDate ?? null,
          assignmentStartDate: emp.assignmentStartDate ?? null,
          assignmentEndDate: emp.assignmentEndDate ?? null,
        })),
      });
    }
  });

  await logActivity({ userId, action: "update", entity: "announcement", entityId: id });

  return recomputeStatus(id);
}

export async function getAnnouncement(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: { employees: true, template: true, signatory: true, movementForms: true },
  });
  if (!announcement) throw ApiError.notFound("Announcement not found");
  return announcement;
}

export interface ListAnnouncementsFilters {
  movementType?: string;
  status?: string;
  company?: string;
  site?: string;
  signatoryId?: string;
  effectiveDateFrom?: Date;
  effectiveDateTo?: Date;
  announcementDateFrom?: Date;
  announcementDateTo?: Date;
  search?: string;
  page: number;
  pageSize: number;
}

export async function listAnnouncements(filters: ListAnnouncementsFilters) {
  const where: Prisma.AnnouncementWhereInput = {};

  if (filters.movementType) where.movementType = filters.movementType as never;
  if (filters.status) where.status = filters.status as never;
  if (filters.signatoryId) where.signatoryId = filters.signatoryId;

  if (filters.announcementDateFrom || filters.announcementDateTo) {
    where.announcementDate = {
      gte: filters.announcementDateFrom,
      lte: filters.announcementDateTo,
    };
  }

  if (filters.company || filters.site || filters.effectiveDateFrom || filters.effectiveDateTo) {
    where.employees = {
      some: {
        newCompany: filters.company ? { contains: filters.company, mode: "insensitive" } : undefined,
        newLocation: filters.site ? { contains: filters.site, mode: "insensitive" } : undefined,
        effectiveDate:
          filters.effectiveDateFrom || filters.effectiveDateTo
            ? { gte: filters.effectiveDateFrom, lte: filters.effectiveDateTo }
            : undefined,
      },
    };
  }

  if (filters.search) {
    where.OR = [
      { number: { contains: filters.search, mode: "insensitive" } },
      { employees: { some: { employeeName: { contains: filters.search, mode: "insensitive" } } } },
      { employees: { some: { employeeId: { contains: filters.search, mode: "insensitive" } } } },
    ];
  }

  const [total, items] = await prisma.$transaction([
    prisma.announcement.count({ where }),
    prisma.announcement.findMany({
      where,
      include: { employees: true, signatory: true, template: true },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
  ]);

  return { total, page: filters.page, pageSize: filters.pageSize, items };
}

export async function narrateAnnouncement(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: employeeInclude,
  });
  if (!announcement) throw ApiError.notFound("Announcement not found");

  const result = buildNarration(
    announcement.movementType,
    announcement.employees.map((e) => ({
      employeeName: e.employeeName,
      currentPosition: e.currentPosition,
      newPosition: e.newPosition,
      newCompany: e.newCompany,
      newLocation: e.newLocation,
      currentCompany: e.currentCompany,
      currentLocation: e.currentLocation,
      effectiveDate: e.effectiveDate,
      assignmentStartDate: e.assignmentStartDate,
      assignmentEndDate: e.assignmentEndDate,
    })),
    announcement.announcementDate
  );

  await prisma.announcement.update({
    where: { id },
    data: {
      narrationText: result.narrationText,
      effectiveSentence: result.effectiveSentence,
    },
  });

  return result;
}

export async function resolveSignatoryForAnnouncement(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: employeeInclude,
  });
  if (!announcement) throw ApiError.notFound("Announcement not found");

  const resolution = await resolveSignatory(announcement.employees.map((e) => e.currentJs));

  await prisma.announcement.update({
    where: { id },
    data: { signatoryId: resolution.signatoryId },
  });

  return resolution;
}

export async function validateAnnouncementById(id: string) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: employeeInclude,
  });
  if (!announcement) throw ApiError.notFound("Announcement not found");
  return validateAnnouncement(announcement);
}

/** Recomputes narration + signatory, validates, and updates status accordingly. Returns the fresh announcement. */
export async function recomputeStatus(id: string) {
  await narrateAnnouncement(id).catch(() => undefined);
  await resolveSignatoryForAnnouncement(id).catch(() => undefined);

  const report = await validateAnnouncementById(id);
  const current = await prisma.announcement.findUniqueOrThrow({ where: { id } });

  if (!["Finalized", "Published", "Cancelled"].includes(current.status)) {
    await prisma.announcement.update({
      where: { id },
      data: { status: report.valid ? "ReadyToGenerate" : "RequiresReview" },
    });
  }

  return getAnnouncement(id);
}
