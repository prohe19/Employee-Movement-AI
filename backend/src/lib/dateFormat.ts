const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function ordinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

/** e.g. "May 15th, 2026" — used in the generated letter. */
export function formatLetterDate(date: Date): string {
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${month} ${day}${ordinalSuffix(day)}, ${year}`;
}

/** e.g. "May 15, 2026" — used in the app UI. */
export function formatUiDate(date: Date): string {
  const day = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

/** Compares calendar dates (UTC, time-of-day ignored). */
export function compareDates(a: Date, b: Date): -1 | 0 | 1 {
  const da = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const db = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  if (da < db) return -1;
  if (da > db) return 1;
  return 0;
}
