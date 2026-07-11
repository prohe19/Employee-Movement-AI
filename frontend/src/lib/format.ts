import type { MovementType } from "../api/types";

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  Transfer: "Transfer",
  TemporaryAssignment: "Temporary Assignment",
  PermanentAssignment: "Permanent Assignment",
  Rotation: "Rotation",
  LateralMovement: "Lateral Movement",
  ChangeOfPosition: "Change of Position",
  ChangeOfLocation: "Change of Location",
  ChangeOfCompany: "Change of Company",
  ActingAssignment: "Acting Assignment",
  EndOfAssignment: "End of Assignment",
  Other: "Other Employee Movement",
};

export const MOVEMENT_TYPES = Object.keys(MOVEMENT_TYPE_LABELS) as MovementType[];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** App UI date, e.g. "May 15, 2026". Accepts ISO strings or Date. */
export function formatUiDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** For <input type="date"> values (yyyy-mm-dd). */
export function toDateInputValue(input: string | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
