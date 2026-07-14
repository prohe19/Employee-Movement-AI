import { z } from "zod";

export const movementTypeEnum = z.enum([
  "Transfer",
  "TemporaryAssignment",
  "PermanentAssignment",
  "Rotation",
  "LateralMovement",
  "ChangeOfPosition",
  "ChangeOfLocation",
  "ChangeOfCompany",
  "ActingAssignment",
  "EndOfAssignment",
  "Other",
]);

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
});
export type EmployeeInput = z.infer<typeof employeeInputSchema>;

export const createAnnouncementSchema = z.object({
  number: z.string().optional(),
  announcementDate: isoDate.optional(),
  city: z.string().optional(),
  templateId: z.string().uuid().optional().nullable(),
  movementType: movementTypeEnum,
  notes: z.string().optional().nullable(),
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
  signatoryId: z.string().uuid().optional().nullable(),
  employees: z.array(employeeInputSchema).min(1).optional(),
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

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
