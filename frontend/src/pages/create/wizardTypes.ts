import type { Announcement, MovementType } from "../../api/types";

/** An editable employee row entered manually in the movement-details step. */
export interface EditableEmployee {
  title: string;
  employeeName: string;
  employeeId: string;
  currentPosition: string;
  newPosition: string;
  currentJs: string;
  newJs: string;
  currentDepartment: string;
  newDepartment: string;
  currentDivision: string;
  newDivision: string;
  currentCompany: string;
  newCompany: string;
  currentLocation: string;
  newLocation: string;
  effectiveDate: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  photoUrl: string;
  photoKey: string;
}

/** Maximum number of employee movements allowed under one announcement letter. */
export const MAX_EMPLOYEES = 3;

/** Honorific options for the title dropdown. */
export const TITLE_OPTIONS = ["Mr.", "Ms.", "Mrs."] as const;

export interface WizardState {
  announcementNumber: string;
  announcementDate: string;
  city: string;
  notes: string;
  templateId: string;
  movementType: MovementType;
  emailLogoKey: string;
  letterheadKey: string;
  employees: EditableEmployee[];
  announcementId: string | null;
}

export function emptyEmployee(): EditableEmployee {
  return {
    title: "Mr.",
    employeeName: "",
    employeeId: "",
    currentPosition: "",
    newPosition: "",
    currentJs: "",
    newJs: "",
    currentDepartment: "",
    newDepartment: "",
    currentDivision: "",
    newDivision: "",
    currentCompany: "",
    newCompany: "",
    currentLocation: "",
    newLocation: "",
    effectiveDate: "",
    assignmentStartDate: "",
    assignmentEndDate: "",
    photoUrl: "",
    photoKey: "",
  };
}

/** Converts an editable employee to the API payload shape (nulls + numbers). */
export function employeeToPayload(emp: EditableEmployee) {
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const str = (v: string) => (v.trim() === "" ? null : v.trim());
  const date = (v: string) => (v.trim() === "" ? null : new Date(v).toISOString());
  return {
    title: str(emp.title),
    employeeName: emp.employeeName.trim(),
    employeeId: str(emp.employeeId),
    currentPosition: str(emp.currentPosition),
    newPosition: str(emp.newPosition),
    currentJs: num(emp.currentJs),
    newJs: num(emp.newJs),
    currentDepartment: str(emp.currentDepartment),
    newDepartment: str(emp.newDepartment),
    currentDivision: str(emp.currentDivision),
    newDivision: str(emp.newDivision),
    currentCompany: str(emp.currentCompany),
    newCompany: str(emp.newCompany),
    currentLocation: str(emp.currentLocation),
    newLocation: str(emp.newLocation),
    effectiveDate: date(emp.effectiveDate),
    assignmentStartDate: date(emp.assignmentStartDate),
    assignmentEndDate: date(emp.assignmentEndDate),
    photoUrl: str(emp.photoUrl),
    photoKey: str(emp.photoKey),
  };
}

/** Seeds the wizard from an existing announcement (for the edit flow). */
export function announcementToWizardState(a: Announcement): WizardState {
  const dstr = (v: string | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");
  const nstr = (v: number | null | undefined) => (v == null ? "" : String(v));
  const employees =
    a.employees && a.employees.length > 0
      ? a.employees.map((e) => ({
          title: e.title ?? "Mr.",
          employeeName: e.employeeName ?? "",
          employeeId: e.employeeId ?? "",
          currentPosition: e.currentPosition ?? "",
          newPosition: e.newPosition ?? "",
          currentJs: nstr(e.currentJs),
          newJs: nstr(e.newJs),
          currentDepartment: e.currentDepartment ?? "",
          newDepartment: e.newDepartment ?? "",
          currentDivision: e.currentDivision ?? "",
          newDivision: e.newDivision ?? "",
          currentCompany: e.currentCompany ?? "",
          newCompany: e.newCompany ?? "",
          currentLocation: e.currentLocation ?? "",
          newLocation: e.newLocation ?? "",
          effectiveDate: dstr(e.effectiveDate),
          assignmentStartDate: dstr(e.assignmentStartDate),
          assignmentEndDate: dstr(e.assignmentEndDate),
          photoUrl: e.photoUrl ?? "",
          photoKey: e.photoKey ?? "",
        }))
      : [emptyEmployee()];
  return {
    announcementNumber: a.number ?? "",
    announcementDate: dstr(a.announcementDate) || new Date().toISOString().slice(0, 10),
    city: a.city ?? "Jakarta",
    notes: a.notes ?? "",
    templateId: a.templateId ?? "",
    movementType: a.movementType,
    emailLogoKey: a.emailLogoKey ?? "ITM",
    letterheadKey: a.letterheadKey ?? "ITM",
    employees,
    announcementId: a.id,
  };
}
