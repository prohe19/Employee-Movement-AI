export type Role = "hr_user" | "admin";

export interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type MovementType = "Transfer" | "Assignment";

export type AnnouncementStatus =
  | "Draft"
  | "RequiresReview"
  | "ReadyToGenerate"
  | "Finalized"
  | "Published"
  | "Cancelled";

export type Confidence = "high" | "review" | "missing";

export interface ConfidenceField<T> {
  value: T | null;
  confidence: Confidence;
}

export interface ExtractedEmployee {
  employeeName: ConfidenceField<string>;
  employeeId: ConfidenceField<string>;
  currentPosition: ConfidenceField<string>;
  newPosition: ConfidenceField<string>;
  currentJs: ConfidenceField<number>;
  newJs: ConfidenceField<number>;
  currentDepartment: ConfidenceField<string>;
  newDepartment: ConfidenceField<string>;
  currentDivision: ConfidenceField<string>;
  newDivision: ConfidenceField<string>;
  currentCostCenter: ConfidenceField<string>;
  newCostCenter: ConfidenceField<string>;
  currentCompany: ConfidenceField<string>;
  newCompany: ConfidenceField<string>;
  currentLocation: ConfidenceField<string>;
  newLocation: ConfidenceField<string>;
  effectiveDate: ConfidenceField<string>;
  assignmentStartDate: ConfidenceField<string>;
  assignmentEndDate: ConfidenceField<string>;
}

export interface ExtractionResult {
  movementType: ConfidenceField<MovementType>;
  employees: ExtractedEmployee[];
  sourceSection?: string | null;
  overallConfidence: number;
}

export interface MovementForm {
  id: string;
  announcementId: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  extractionJson: ExtractionResult | null;
  extractionConfidence: number | null;
  reviewStatus: string;
  createdAt: string;
}

export interface AnnouncementEmployee {
  id: string;
  announcementId: string;
  title: string | null;
  employeeName: string;
  employeeId: string | null;
  movementType: MovementType | null;
  currentPosition: string | null;
  newPosition: string | null;
  currentJs: number | null;
  newJs: number | null;
  currentDepartment: string | null;
  newDepartment: string | null;
  currentDivision: string | null;
  newDivision: string | null;
  currentCostCenter: string | null;
  newCostCenter: string | null;
  currentCompany: string | null;
  newCompany: string | null;
  currentLocation: string | null;
  newLocation: string | null;
  effectiveDate: string | null;
  assignmentStartDate: string | null;
  assignmentEndDate: string | null;
  photoUrl: string | null;
  photoKey: string | null;
}

export interface TransferForm {
  id: string;
  docNumber: string | null;
  transferType: "between_companies" | "within_company" | null;
  movementType: MovementType;
  title: string | null;
  employeeName: string;
  employeeId: string | null;
  levelJs: number | null;
  levelJp: number | null;
  positionFrom: string | null;
  positionTo: string | null;
  costCenterFrom: string | null;
  costCenterTo: string | null;
  sectionFrom: string | null;
  sectionTo: string | null;
  departmentFrom: string | null;
  departmentTo: string | null;
  divisionFrom: string | null;
  divisionTo: string | null;
  locationFrom: string | null;
  locationTo: string | null;
  companyFrom: string | null;
  companyTo: string | null;
  effectiveDate: string | null;
  vMpp: boolean;
  vOrgStructureJe: boolean;
  vCompetencyGap: boolean;
  vJpGap: boolean;
  vYearInPosition: boolean;
  vTransferReason: boolean;
  vOthers: boolean;
  pdfUrl: string | null;
  createdAt: string;
}

export interface Signatory {
  id: string;
  name: string;
  title: string;
  jsMin: number | null;
  jsMax: number | null;
  isActive: boolean;
  signatureImageUrl: string | null;
}

export interface Template {
  id: string;
  name: string;
  code: string;
  version: number;
  companyScope: string | null;
  movementTypeScope: MovementType | null;
  isActive: boolean;
  fileUrl: string | null;
  placeholders: { tokens?: string[] } | null;
  updatedAt: string;
}

export interface Announcement {
  id: string;
  number: string;
  announcementDate: string;
  city: string;
  templateId: string | null;
  movementType: MovementType;
  status: AnnouncementStatus;
  narrationText: string | null;
  effectiveSentence: string | null;
  signatoryId: string | null;
  notes: string | null;
  pdfUrl: string | null;
  emailImageUrl: string | null;
  emailLogoKey: string | null;
  letterheadKey: string | null;
  createdAt: string;
  updatedAt: string;
  employees: AnnouncementEmployee[];
  signatory?: Signatory | null;
  template?: Template | null;
}

export interface ValidationRuleResult {
  code: string;
  label: string;
  passed: boolean;
  message?: string;
}

export interface ValidationReport {
  valid: boolean;
  rules: ValidationRuleResult[];
}

export interface SignatoryResolution {
  signatoryId: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  resolvedFromJs: number | null;
  blocked: boolean;
  reason?: string;
}

export interface NarrationResult {
  narrationText: string;
  effectiveSentence: string;
  blocked: boolean;
  blockReason?: string;
}

export interface Setting {
  id: number;
  numberingFormat: string;
  defaultCity: string;
  defaultCompany: string;
  defaultTemplateId: string | null;
  dateFormat: string;
  retentionPolicy: string | null;
}

export interface DashboardSummary {
  kpis: {
    totalAnnouncements: number;
    requiresReview: number;
    readyToGenerate: number;
    finalizedThisMonth: number;
  };
  movementDistribution: { movementType: MovementType; count: number }[];
  recentAnnouncements: Announcement[];
  upcomingEffectiveDates: (AnnouncementEmployee & { announcement: Announcement })[];
  recentExtractions: MovementForm[];
}

export interface Paginated<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}
