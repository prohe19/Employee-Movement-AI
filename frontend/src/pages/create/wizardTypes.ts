import type { MovementType } from "../../api/types";

/** An editable employee row entered manually in the movement-details step. */
export interface EditableEmployee {
  title: string;
  employeeName: string;
  employeeId: string;
  currentPosition: string;
  newPosition: string;
  currentJs: string;
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
