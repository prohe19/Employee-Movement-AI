import type { Confidence, ExtractionResult, MovementType } from "../../api/types";

/** An editable employee row in the review step, carrying per-field confidence for the dots. */
export interface EditableEmployee {
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
  currentCostCenter: string;
  newCostCenter: string;
  currentCompany: string;
  newCompany: string;
  currentLocation: string;
  newLocation: string;
  effectiveDate: string;
  assignmentStartDate: string;
  assignmentEndDate: string;
  confidence: Partial<Record<keyof Omit<EditableEmployee, "confidence">, Confidence>>;
}

export interface WizardState {
  formId: string | null;
  fileName: string | null;
  fileUrl: string | null;
  pageCount: number | null;
  announcementNumber: string;
  announcementDate: string;
  city: string;
  notes: string;
  templateId: string;
  movementType: MovementType;
  employees: EditableEmployee[];
  announcementId: string | null;
}

const dateField = (v: string | null) => v ?? "";

export function emptyEmployee(): EditableEmployee {
  return {
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
    currentCostCenter: "",
    newCostCenter: "",
    currentCompany: "",
    newCompany: "",
    currentLocation: "",
    newLocation: "",
    effectiveDate: "",
    assignmentStartDate: "",
    assignmentEndDate: "",
    confidence: {},
  };
}

/** Maps the AI extraction result into editable employee rows + a movement type. */
export function extractionToEmployees(result: ExtractionResult): {
  employees: EditableEmployee[];
  movementType: MovementType;
} {
  const employees = result.employees.map((emp) => {
    const row = emptyEmployee();
    const set = <K extends keyof Omit<EditableEmployee, "confidence">>(
      key: K,
      raw: { value: unknown; confidence: Confidence }
    ) => {
      row[key] = (raw.value === null || raw.value === undefined ? "" : String(raw.value)) as EditableEmployee[K];
      row.confidence[key] = raw.confidence;
    };
    set("employeeName", emp.employeeName);
    set("employeeId", emp.employeeId);
    set("currentPosition", emp.currentPosition);
    set("newPosition", emp.newPosition);
    set("currentJs", emp.currentJs);
    set("newJs", emp.newJs);
    set("currentDepartment", emp.currentDepartment);
    set("newDepartment", emp.newDepartment);
    set("currentDivision", emp.currentDivision);
    set("newDivision", emp.newDivision);
    set("currentCostCenter", emp.currentCostCenter);
    set("newCostCenter", emp.newCostCenter);
    set("currentCompany", emp.currentCompany);
    set("newCompany", emp.newCompany);
    set("currentLocation", emp.currentLocation);
    set("newLocation", emp.newLocation);
    row.effectiveDate = dateField(emp.effectiveDate.value);
    row.confidence.effectiveDate = emp.effectiveDate.confidence;
    row.assignmentStartDate = dateField(emp.assignmentStartDate.value);
    row.confidence.assignmentStartDate = emp.assignmentStartDate.confidence;
    row.assignmentEndDate = dateField(emp.assignmentEndDate.value);
    row.confidence.assignmentEndDate = emp.assignmentEndDate.confidence;
    return row;
  });

  return {
    employees: employees.length ? employees : [emptyEmployee()],
    movementType: result.movementType.value ?? "Other",
  };
}

/** Converts an editable employee to the API payload shape (nulls + numbers). */
export function employeeToPayload(emp: EditableEmployee) {
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const str = (v: string) => (v.trim() === "" ? null : v.trim());
  const date = (v: string) => (v.trim() === "" ? null : new Date(v).toISOString());
  return {
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
    currentCostCenter: str(emp.currentCostCenter),
    newCostCenter: str(emp.newCostCenter),
    currentCompany: str(emp.currentCompany),
    newCompany: str(emp.newCompany),
    currentLocation: str(emp.currentLocation),
    newLocation: str(emp.newLocation),
    effectiveDate: date(emp.effectiveDate),
    assignmentStartDate: date(emp.assignmentStartDate),
    assignmentEndDate: date(emp.assignmentEndDate),
  };
}
