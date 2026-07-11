import type { MovementType } from "@prisma/client";
import { compareDates, formatLetterDate } from "../lib/dateFormat";

export type Tense = "future" | "present" | "past";

export interface NarrationEmployeeInput {
  employeeName: string;
  currentPosition: string | null;
  newPosition: string | null;
  newCompany: string | null;
  newLocation: string | null;
  currentCompany: string | null;
  currentLocation: string | null;
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

function verbsFor(movementType: MovementType): { future: string; present: string; past: string } {
  switch (movementType) {
    case "Transfer":
      return { future: "will be transferred", present: "is transferred", past: "has been transferred" };
    case "TemporaryAssignment":
    case "PermanentAssignment":
    case "ActingAssignment":
      return { future: "will be assigned", present: "is assigned", past: "has been assigned" };
    case "Rotation":
    case "LateralMovement":
      return { future: "will move", present: "moves", past: "has moved" };
    case "ChangeOfPosition":
      return {
        future: "will change position",
        present: "changes position",
        past: "has changed position",
      };
    case "ChangeOfLocation":
      return {
        future: "will change location",
        present: "changes location",
        past: "has changed location",
      };
    case "ChangeOfCompany":
      return {
        future: "will change company",
        present: "changes company",
        past: "has changed company",
      };
    default:
      return { future: "will move", present: "moves", past: "has moved" };
  }
}

/** The bullet sentence for one employee, by movement type + tense (effective date vs announcement date). */
export function buildMovementSentence(
  movementType: MovementType,
  employee: NarrationEmployeeInput,
  effectiveDate: Date,
  announcementDate: Date
): string {
  const { employeeName, currentPosition, newPosition, newCompany, newLocation } = employee;

  if (movementType === "EndOfAssignment") {
    const endDate = employee.assignmentEndDate;
    const company = employee.currentCompany ?? newCompany ?? "";
    const location = employee.currentLocation ?? newLocation ?? "";
    const assignedPosition = currentPosition ?? "";
    const endDateStr = endDate ? formatLetterDate(endDate) : "";
    return `${employeeName}'s assignment as ${assignedPosition} at ${company}, ${location} will conclude on ${endDateStr}.`;
  }

  const tense = computeTense(effectiveDate, announcementDate);
  const verbs = verbsFor(movementType);
  const verb = verbs[tense];

  return `${employeeName} ${verb} from ${currentPosition ?? ""} to ${newPosition ?? ""}, ${newCompany ?? ""}, ${newLocation ?? ""}.`;
}

/** The effective-date sentence for non assignment-style movements. */
export function buildEffectiveDateSentence(effectiveDate: Date, announcementDate: Date): string {
  const tense = computeTense(effectiveDate, announcementDate);
  const dateStr = formatLetterDate(effectiveDate);
  switch (tense) {
    case "future":
      return `This announcement will be effective as of ${dateStr}.`;
    case "present":
      return `This announcement is effective as of ${dateStr}.`;
    case "past":
      return `This announcement has been effective since ${dateStr}.`;
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
 * following the tense/assignment rules in the backend spec.
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
