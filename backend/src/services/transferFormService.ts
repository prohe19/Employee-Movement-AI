import type { Prisma, TransferForm } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import type { TransferFormInput } from "../types/dto";
import { renderTransferFormHtml, type TransferFormData } from "./transferFormTemplateService";
import { renderTransferFormPdf } from "./pdfService";
import { getStorageDriver } from "./storage";
import { logActivity } from "./activityLogService";

function toCreateData(input: TransferFormInput): Omit<Prisma.TransferFormCreateInput, "creator"> {
  return {
    docNumber: input.docNumber ?? undefined,
    transferType: input.transferType ?? undefined,
    movementType: input.movementType,
    title: input.title ?? undefined,
    employeeName: input.employeeName,
    employeeId: input.employeeId ?? undefined,
    levelJs: input.levelJs ?? undefined,
    levelJp: input.levelJp ?? undefined,
    positionFrom: input.positionFrom ?? undefined,
    positionTo: input.positionTo ?? undefined,
    costCenterFrom: input.costCenterFrom ?? undefined,
    costCenterTo: input.costCenterTo ?? undefined,
    sectionFrom: input.sectionFrom ?? undefined,
    sectionTo: input.sectionTo ?? undefined,
    departmentFrom: input.departmentFrom ?? undefined,
    departmentTo: input.departmentTo ?? undefined,
    divisionFrom: input.divisionFrom ?? undefined,
    divisionTo: input.divisionTo ?? undefined,
    locationFrom: input.locationFrom ?? undefined,
    locationTo: input.locationTo ?? undefined,
    companyFrom: input.companyFrom ?? undefined,
    companyTo: input.companyTo ?? undefined,
    effectiveDate: input.effectiveDate ?? undefined,
    vMpp: input.vMpp ?? false,
    vOrgStructureJe: input.vOrgStructureJe ?? false,
    vCompetencyGap: input.vCompetencyGap ?? false,
    vJpGap: input.vJpGap ?? false,
    vYearInPosition: input.vYearInPosition ?? false,
    vTransferReason: input.vTransferReason ?? false,
    vOthers: input.vOthers ?? false,
  };
}

export async function createTransferForm(userId: string, input: TransferFormInput) {
  const form = await prisma.transferForm.create({
    data: { ...toCreateData(input), creator: { connect: { id: userId } } },
  });
  await logActivity({ userId, action: "create", entity: "transfer_form", entityId: form.id });
  return form;
}

export async function updateTransferForm(id: string, userId: string, input: TransferFormInput) {
  const existing = await prisma.transferForm.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Transfer form not found");
  const form = await prisma.transferForm.update({ where: { id }, data: toCreateData(input) });
  await logActivity({ userId, action: "update", entity: "transfer_form", entityId: id });
  return form;
}

export async function listTransferForms(search?: string) {
  const where: Prisma.TransferFormWhereInput = search
    ? {
        OR: [
          { employeeName: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
          { docNumber: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  return prisma.transferForm.findMany({ where, orderBy: { createdAt: "desc" } });
}

export async function getTransferForm(id: string) {
  const form = await prisma.transferForm.findUnique({ where: { id } });
  if (!form) throw ApiError.notFound("Transfer form not found");
  return form;
}

export async function deleteTransferForm(id: string, userId: string) {
  const existing = await prisma.transferForm.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Transfer form not found");
  await prisma.transferForm.delete({ where: { id } });
  await logActivity({ userId, action: "delete", entity: "transfer_form", entityId: id });
}

function toTemplateData(form: TransferForm): TransferFormData {
  const ft = (from: string | null, to: string | null) => ({ from: from ?? "", to: to ?? "" });
  return {
    docNumber: form.docNumber ?? "",
    transferType: (form.transferType as TransferFormData["transferType"]) ?? null,
    employeeName: form.employeeName,
    employeeId: form.employeeId ?? "",
    levelJs: form.levelJs != null ? String(form.levelJs) : "",
    levelJp: form.levelJp != null ? String(form.levelJp) : "",
    position: ft(form.positionFrom, form.positionTo),
    costCenter: ft(form.costCenterFrom, form.costCenterTo),
    section: ft(form.sectionFrom, form.sectionTo),
    department: ft(form.departmentFrom, form.departmentTo),
    division: ft(form.divisionFrom, form.divisionTo),
    location: ft(form.locationFrom, form.locationTo),
    company: ft(form.companyFrom, form.companyTo),
    effectiveDate: form.effectiveDate,
    verification: {
      mpp: form.vMpp,
      orgStructureJe: form.vOrgStructureJe,
      competencyGap: form.vCompetencyGap,
      jpGap: form.vJpGap,
      yearInPosition: form.vYearInPosition,
      transferReason: form.vTransferReason,
      others: form.vOthers,
    },
  };
}

export async function generateTransferFormPdf(id: string, userId: string) {
  const form = await getTransferForm(id);
  const html = renderTransferFormHtml(toTemplateData(form));
  const pdfBuffer = await renderTransferFormPdf(html);

  const storage = getStorageDriver();
  const key = `transfer-forms/${form.id}/${Date.now()}.pdf`;
  const stored = await storage.save({ buffer: pdfBuffer, key, contentType: "application/pdf" });

  const updated = await prisma.transferForm.update({
    where: { id },
    data: { pdfUrl: stored.url },
  });
  await logActivity({
    userId,
    action: "generate_pdf",
    entity: "transfer_form",
    entityId: id,
    metadata: { pdfUrl: stored.url },
  });
  return updated;
}
