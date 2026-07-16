import type { MovementType } from "@prisma/client";
import { compareDates, formatLetterDate } from "../lib/dateFormat";

export type Tense = "future" | "present" | "past";

export interface NarrationEmployeeInput {
  title: string | null; // Mr. / Ms. / Mrs.
  employeeName: string;
  currentPosition: string | null;
  newPosition: string | null;
  currentDepartment: string | null;
  newDepartment: string | null;
  currentDivision: string | null;
  newDivision: string | null;
  currentCompany: string | null;
  newCompany: string | null;
  currentLocation: string | null;
  newLocation: string | null;
  effectiveDate: Date | null;
  assignmentStartDate: Date | null;
  assignmentEndDate: Date | null;
}

export function computeTense(effectiveDate: Date, announcementDate: Date): Tense {
  const cmp = compareDates(effectiveDate, announcementDate);
  if (cmp > 0) return "future";
  if (cmp === 0) return "present";
  return "past";
}

const ASSIGNMENT_LIKE: MovementType[] = ["TemporaryAssignment", "ActingAssignment"];

/** Movement verb by type and tense — e.g. "is transferred", "will be assigned". */
function verbsFor(movementType: MovementType): { future: string; present: string; past: string } {
  switch (movementType) {
    case "Transfer":
    case "ChangeOfPosition":
    case "ChangeOfLocation":
    case "ChangeOfCompany":
      return { future: "will be transferred", present: "is transferred", past: "has been transferred" };
    case "TemporaryAssignment":
    case "PermanentAssignment":
    case "ActingAssignment":
      return { future: "will be assigned", present: "is assigned", past: "has been assigned" };
    case "Rotation":
      return { future: "will be rotated", present: "is rotated", past: "has been rotated" };
    case "LateralMovement":
      return { future: "will be moved", present: "is moved", past: "has been moved" };
    default:
      return { future: "will be moved", present: "is moved", past: "has been moved" };
  }
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

/** Full name with honorific, e.g. "Mr. Budhi Cahyono". */
function personName(emp: NarrationEmployeeInput): string {
  return [clean(emp.title), clean(emp.employeeName)].filter(Boolean).join(" ");
}

/** Position + department + division, comma-joined (blanks skipped). */
function roleSegment(position: string | null, department: string | null, division: string | null): string {
  return [clean(position), clean(department), clean(division)].filter(Boolean).join(", ");
}

/** "{company} at {site}" — or just one of them when the other is blank. */
function placeSegment(company: string | null, site: string | null): string {
  const c = clean(company);
  const s = clean(site);
  if (c && s) return `${c} at ${s}`;
  if (c) return c;
  if (s) return `at ${s}`;
  return "";
}

function sameText(a: string | null, b: string | null): boolean {
  return clean(a).toLowerCase() === clean(b).toLowerCase();
}

/**
 * The bullet sentence for one employee. Follows the real ITM letter format:
 * "{Mr.} {Name} {verb} from {role}, {company} at {site} to {new role}, {new company} at {new site}."
 * When the current and new company AND site are identical, the place is stated once at the end:
 * "{Mr.} {Name} {verb} from {role} to {new role}, {company} at {site}."
 */
export function buildMovementSentence(
  movementType: MovementType,
  employee: NarrationEmployeeInput,
  effectiveDate: Date,
  announcementDate: Date
): string {
  if (movementType === "EndOfAssignment") {
    const endDate = employee.assignmentEndDate;
    const place = placeSegment(
      employee.currentCompany ?? employee.newCompany,
      employee.currentLocation ?? employee.newLocation
    );
    const assignedPosition = clean(employee.currentPosition);
    const endDateStr = endDate ? formatLetterDate(endDate) : "";
    return `${personName(employee)}'s assignment as ${assignedPosition}${place ? `, ${place}` : ""} will conclude on ${endDateStr}.`;
  }

  const tense = computeTense(effectiveDate, announcementDate);
  const verb = verbsFor(movementType)[tense];

  const fromRole = roleSegment(employee.currentPosition, employee.currentDepartment, employee.currentDivision);
  const toRole = roleSegment(employee.newPosition, employee.newDepartment, employee.newDivision);
  const fromPlace = placeSegment(employee.currentCompany, employee.currentLocation);
  const toPlace = placeSegment(employee.newCompany, employee.newLocation);

  const sameCompany = sameText(employee.currentCompany, employee.newCompany);
  const sameSite = sameText(employee.currentLocation, employee.newLocation);

  // Collapse: same company AND same site → state the place once at the end.
  if (sameCompany && sameSite && toPlace) {
    return `${personName(employee)} ${verb} from ${fromRole} to ${toRole}, ${toPlace}.`;
  }

  const fromFull = fromPlace ? `${fromRole}, ${fromPlace}` : fromRole;
  const toFull = toPlace ? `${toRole}, ${toPlace}` : toRole;
  return `${personName(employee)} ${verb} from ${fromFull} to ${toFull}.`;
}

/** The announcement effective-date sentence, tense-adjusted (matches the real ITM wording). */
export function buildEffectiveDateSentence(effectiveDate: Date, announcementDate: Date): string {
  const tense = computeTense(effectiveDate, announcementDate);
  const dateStr = formatLetterDate(effectiveDate);
  switch (tense) {
    case "future":
      return `This announcement will be effectively applied starting from ${dateStr}.`;
    case "present":
      return `This announcement is effectively applied starting from ${dateStr}.`;
    case "past":
      return `This announcement has been effectively applied starting from ${dateStr}.`;
  }
}

export type AssignmentDateStatus = "not_started" | "starts_today" | "ongoing" | "ended";

export function computeAssignmentDateStatus(
  startDate: Date,
  endDate: Date,
  announcementDate: Date
): AssignmentDateStatus {
  const startCmp = compareDates(startDate, announcementDate);
  const endCmp = compareDates(endDate, announcementDate);
  if (endCmp < 0) return "ended";
  if (startCmp > 0) return "not_started";
  if (startCmp === 0) return "starts_today";
  return "ongoing";
}

/** Temporary/acting assignment date sentence — compares start & end against the announcement date. */
export function buildAssignmentDateSentence(
  startDate: Date,
  endDate: Date,
  announcementDate: Date
): { sentence: string; blocked: boolean } {
  const status = computeAssignmentDateStatus(startDate, endDate, announcementDate);
  const startStr = formatLetterDate(startDate);
  const endStr = formatLetterDate(endDate);

  switch (status) {
    case "not_started":
      return { sentence: `The assignment will be effective from ${startStr} to ${endStr}.`, blocked: false };
    case "starts_today":
      return { sentence: `The assignment is effective from ${startStr} to ${endStr}.`, blocked: false };
    case "ongoing":
      return {
        sentence: `The assignment has been effective from ${startStr} and will continue until ${endStr}.`,
        blocked: false,
      };
    case "ended":
      return {
        sentence:
          "The assignment period ended before the announcement date. Please confirm whether this is a retrospective announcement or an end-of-assignment announcement.",
        blocked: true,
      };
  }
}

export function isAssignmentLike(movementType: MovementType): boolean {
  return ASSIGNMENT_LIKE.includes(movementType);
}

export interface NarrationResult {
  narrationText: string;
  effectiveSentence: string;
  blocked: boolean;
  blockReason?: string;
}

/**
 * Builds the full narration (one bullet per employee) + the effective-date sentence,
 * following the ITM letter format and the tense/assignment rules.
 */
export function buildNarration(
  movementType: MovementType,
  employees: NarrationEmployeeInput[],
  announcementDate: Date
): NarrationResult {
  const sentences: string[] = [];
  let effectiveSentence = "";
  let blocked = false;
  let blockReason: string | undefined;

  for (const employee of employees) {
    if (isAssignmentLike(movementType)) {
      if (!employee.assignmentStartDate || !employee.assignmentEndDate) {
        blocked = true;
        blockReason = `${employee.employeeName}: assignment start and end dates are required.`;
        continue;
      }
      const effectiveDate = employee.assignmentStartDate;
      sentences.push(buildMovementSentence(movementType, employee, effectiveDate, announcementDate));
      const { sentence, blocked: dateBlocked } = buildAssignmentDateSentence(
        employee.assignmentStartDate,
        employee.assignmentEndDate,
        announcementDate
      );
      effectiveSentence = sentence;
      if (dateBlocked) {
        blocked = true;
        blockReason = sentence;
      }
    } else if (movementType === "EndOfAssignment") {
      if (!employee.assignmentEndDate) {
        blocked = true;
        blockReason = `${employee.employeeName}: assignment end date is required.`;
        continue;
      }
      sentences.push(
        buildMovementSentence(movementType, employee, employee.assignmentEndDate, announcementDate)
      );
    } else {
      const effectiveDate = employee.effectiveDate;
      if (!effectiveDate) {
        blocked = true;
        blockReason = `${employee.employeeName}: effective date is required.`;
        continue;
      }
      sentences.push(buildMovementSentence(movementType, employee, effectiveDate, announcementDate));
      effectiveSentence = buildEffectiveDateSentence(effectiveDate, announcementDate);
    }
  }

  return {
    narrationText: sentences.map((s) => `• ${s}`).join("\n"),
    effectiveSentence,
    blocked,
    blockReason,
  };
}
