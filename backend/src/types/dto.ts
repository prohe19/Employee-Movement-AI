import { z } from "zod";

export const movementTypeEnum = z.enum(["Transfer", "Assignment"]);

export const announcementStatusEnum = z.enum([
  "Draft",
  "RequiresReview",
  "ReadyToGenerate",
  "Finalized",
  "Published",
  "Cancelled",
]);

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), "Must be a valid ISO date")
  .transform((v) => new Date(v));

export const employeeInputSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().optional().nullable(),
  employeeName: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  movementType: movementTypeEnum.optional().nullable(),
  currentPosition: z.string().optional().nullable(),
  newPosition: z.string().optional().nullable(),
  currentJs: z.number().int().optional().nullable(),
  newJs: z.number().int().optional().nullable(),
  currentDepartment: z.string().optional().nullable(),
  newDepartment: z.string().optional().nullable(),
  currentDivision: z.string().optional().nullable(),
  newDivision: z.string().optional().nullable(),
  currentCostCenter: z.string().optional().nullable(),
  newCostCenter: z.string().optional().nullable(),
  currentCompany: z.string().optional().nullable(),
  newCompany: z.string().optional().nullable(),
  currentLocation: z.string().optional().nullable(),
  newLocation: z.string().optional().nullable(),
  effectiveDate: isoDate.optional().nullable(),
  assignmentStartDate: isoDate.optional().nullable(),
  assignmentEndDate: isoDate.optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  photoKey: z.string().optional().nullable(),
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const createAnnouncementSchema = z.object({
  number: z.string().optional(),
  announcementDate: isoDate.optional(),
  city: z.string().optional(),
  templateId: z.string().uuid().optional().nullable(),
  movementType: movementTypeEnum,
  notes: z.string().optional().nullable(),
  emailLogoKey: z.string().optional().nullable(),
  letterheadKey: z.string().optional().nullable(),
  employees: z.array(employeeInputSchema).min(1),
});
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
  number: z.string().optional(),
  announcementDate: isoDate.optional(),
  city: z.string().optional(),
  templateId: z.string().uuid().optional().nullable(),
  movementType: movementTypeEnum.optional(),
  status: announcementStatusEnum.optional(),
  notes: z.string().optional().nullable(),
  emailLogoKey: z.string().optional().nullable(),
  letterheadKey: z.string().optional().nullable(),
  signatoryId: z.string().uuid().optional().nullable(),
  employees: z.array(employeeInputSchema).min(1).optional(),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const transferFormSchema = z.object({
  docNumber: z.string().optional().nullable(),
  transferType: z.enum(["between_companies", "within_company"]).optional().nullable(),
  movementType: movementTypeEnum.default("Transfer"),
  title: z.string().optional().nullable(),
  employeeName: z.string().min(1),
  employeeId: z.string().optional().nullable(),
  levelJs: z.number().int().optional().nullable(),
  levelJp: z.number().int().optional().nullable(),
  positionFrom: z.string().optional().nullable(),
  positionTo: z.string().optional().nullable(),
  costCenterFrom: z.string().optional().nullable(),
  costCenterTo: z.string().optional().nullable(),
  sectionFrom: z.string().optional().nullable(),
  sectionTo: z.string().optional().nullable(),
  departmentFrom: z.string().optional().nullable(),
  departmentTo: z.string().optional().nullable(),
  divisionFrom: z.string().optional().nullable(),
  divisionTo: z.string().optional().nullable(),
  locationFrom: z.string().optional().nullable(),
  locationTo: z.string().optional().nullable(),
  companyFrom: z.string().optional().nullable(),
  companyTo: z.string().optional().nullable(),
  effectiveDate: isoDate.optional().nullable(),
  vMpp: z.boolean().optional(),
  vOrgStructureJe: z.boolean().optional(),
  vCompetencyGap: z.boolean().optional(),
  vJpGap: z.boolean().optional(),
  vYearInPosition: z.boolean().optional(),
  vTransferReason: z.boolean().optional(),
  vOthers: z.boolean().optional(),
});
export type TransferFormInput = z.infer<typeof transferFormSchema>;

export const listAnnouncementsQuerySchema = z.object({
  movementType: movementTypeEnum.optional(),
  status: announcementStatusEnum.optional(),
  company: z.string().optional(),
  site: z.string().optional(),
  signatoryId: z.string().uuid().optional(),
  effectiveDateFrom: isoDate.optional(),
  effectiveDateTo: isoDate.optional(),
  announcementDateFrom: isoDate.optional(),
  announcementDateTo: isoDate.optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
