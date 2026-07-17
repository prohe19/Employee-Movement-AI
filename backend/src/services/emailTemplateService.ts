import fs from "node:fs";
import path from "node:path";
import type { MovementType } from "@prisma/client";
import { compareDates, formatLetterDate } from "../lib/dateFormat";
import { calibriFontFaceCss } from "./fontAssets";

/**
 * Builds the HR "Body Email" announcement image (PNG) HTML for employee movements,
 * reproducing the ITM HR PowerPoint template. Two categories (Transfer / Assignment),
 * upcoming vs. past tense, and single vs. multiple (2-3) layouts.
 */

export type EmailCategory = "transfer" | "assignment";
export type EmailTense = "upcoming" | "past";

/** Fields the email needs for one employee (Location, not Division). Photo is required. */
export interface EmailEmployeeInput {
  title: string | null; // Mr. / Ms. / Mrs.
  employeeName: string;
  currentPosition: string | null;
  currentDepartment: string | null;
  currentLocation: string | null;
  currentCompany: string | null;
  newPosition: string | null;
  newDepartment: string | null;
  newLocation: string | null;
  newCompany: string | null;
  effectiveDate: Date | null;
  assignmentStartDate: Date | null;
  assignmentEndDate: Date | null;
  /** Data URI (data:image/...;base64,...) for the employee photo. */
  photoDataUri: string;
}

const ASSIGNMENT_TYPES: MovementType[] = [
  "TemporaryAssignment",
  "PermanentAssignment",
  "ActingAssignment",
];
const TRANSFER_TYPES: MovementType[] = [
  "Transfer",
  "Rotation",
  "LateralMovement",
  "ChangeOfPosition",
  "ChangeOfLocation",
  "ChangeOfCompany",
];

/** Maps a movement type to an email category, or null when the template has no design for it. */
export function emailCategory(movementType: MovementType): EmailCategory | null {
  if (TRANSFER_TYPES.includes(movementType)) return "transfer";
  if (ASSIGNMENT_TYPES.includes(movementType)) return "assignment";
  return null; // EndOfAssignment, Other — not yet covered by the template.
}

const NAVY = "#2f2e79";
const INTERNAL_TEAL = "#2f7d8f";

let bgUpcoming: string | null = null;
let bgPast: string | null = null;
function backgroundDataUri(tense: EmailTense): string {
  if (tense === "past") {
    if (!bgPast) {
      const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "email_bg_past.jpg"));
      bgPast = `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
    return bgPast;
  }
  if (!bgUpcoming) {
    const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "email_bg_upcoming.jpg"));
    bgUpcoming = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }
  return bgUpcoming;
}

function clean(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function personName(emp: EmailEmployeeInput): string {
  return [clean(emp.title), clean(emp.employeeName)].filter(Boolean).join(" ");
}

/** Possessive pronoun from the honorific: Mr. -> his, Ms./Mrs. -> her, else their. */
function possessive(title: string | null): string {
  const t = clean(title).toLowerCase().replace(/\./g, "");
  if (t === "mr") return "his";
  if (t === "ms" || t === "mrs") return "her";
  return "their";
}

/** The date that drives tense + display for one employee (start date for assignments). */
function primaryDate(category: EmailCategory, emp: EmailEmployeeInput): Date | null {
  return category === "assignment" ? emp.assignmentStartDate : emp.effectiveDate;
}

/** Upcoming when the effective date is today or later (same-day counts as upcoming), else past. */
export function emailTense(effectiveDate: Date, announcementDate: Date): EmailTense {
  return compareDates(effectiveDate, announcementDate) >= 0 ? "upcoming" : "past";
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function titleText(category: EmailCategory, plural: boolean): string {
  const noun = category === "transfer" ? "Transfer" : "Assignment";
  return `${plural ? "Employees&rsquo;" : "Employee&rsquo;s"} ${noun}`;
}

function introText(category: EmailCategory, plural: boolean, tense: EmailTense): string {
  const noun = category === "transfer" ? "transfer" : "assignment";
  const nounPl = category === "transfer" ? "transfers" : "assignments";
  const subsidiaries = "PT Indo Tambangraya Megah, Tbk and its subsidiaries";
  if (!plural) {
    if (tense === "upcoming") {
      return `As part of our continued commitment to nurturing employee growth and development, we are delighted to announce an employee ${noun} within ${subsidiaries}:`;
    }
    return `As part of our continued commitment to nurturing employee growth and development, we are delighted to announce that an employee ${noun} within ${subsidiaries} has taken place:`;
  }
  if (tense === "upcoming") {
    return `As part of our continued commitment to nurturing employee growth and development across the organization, we are delighted to announce a series of employee ${nounPl} within ${subsidiaries}:`;
  }
  return `As part of our continued commitment to nurturing employee growth and development across the organization, we are delighted to announce that a series of employee ${nounPl} within ${subsidiaries} have taken place:`;
}

function effectiveText(
  category: EmailCategory,
  plural: boolean,
  tense: EmailTense,
  emp: EmailEmployeeInput
): string {
  const b = (s: string) => `<b>${s}</b>`;
  if (category === "transfer") {
    const date = emp.effectiveDate ? formatLetterDate(emp.effectiveDate) : "";
    if (!plural) {
      return tense === "upcoming"
        ? `This transfer will take effect on ${b(date)}.`
        : `This transfer was effective as of ${b(date)}.`;
    }
    return tense === "upcoming"
      ? `These transfers will take effect on ${b(date)}.`
      : `These transfers were effective as of ${b(date)}.`;
  }
  const start = emp.assignmentStartDate ? formatLetterDate(emp.assignmentStartDate) : "";
  const end = emp.assignmentEndDate ? formatLetterDate(emp.assignmentEndDate) : "";
  if (!plural) {
    return tense === "upcoming"
      ? `This assignment will be effective from ${b(start)} to ${b(end)}.`
      : `This assignment was effective from ${b(start)} to ${b(end)}.`;
  }
  return tense === "upcoming"
    ? `These assignments will be effective from ${b(start)} to ${b(end)}.`
    : `These assignments were effective from ${b(start)} to ${b(end)}.`;
}

function closingText(category: EmailCategory, employees: EmailEmployeeInput[]): string {
  const roleWord = category === "transfer" ? "role" : "assignment";
  if (employees.length === 1) {
    const emp = employees[0];
    const p = possessive(emp.title);
    return `We extend our deepest appreciation to ${escapeHtml(personName(emp))} for ${p} continued dedication and commitment to the company and look forward to ${p} success in this new ${roleWord}.`;
  }
  return `We extend our deepest appreciation for their continued dedication and commitment to the company and look forward to their success in their respective new ${roleWord}s.`;
}

function fieldRows(
  position: string | null,
  department: string | null,
  location: string | null,
  company: string | null
): string {
  const row = (label: string, value: string | null) =>
    `<div class="row"><span class="rl">${label}</span><span class="rc">:</span><span class="rv">${escapeHtml(clean(value) || "-")}</span></div>`;
  return (
    row("Position", position) +
    row("Department", department) +
    row("Location", location) +
    row("Company", company)
  );
}

function fromToCard(emp: EmailEmployeeInput): string {
  return `
    <div class="ch">From</div>
    ${fieldRows(emp.currentPosition, emp.currentDepartment, emp.currentLocation, emp.currentCompany)}
    <div class="gap"></div>
    <div class="ch">To</div>
    ${fieldRows(emp.newPosition, emp.newDepartment, emp.newLocation, emp.newCompany)}`;
}

export interface EmailImageInput {
  movementType: MovementType;
  employees: EmailEmployeeInput[];
  announcementDate: Date;
}

export interface EmailImageBuild {
  html: string;
  category: EmailCategory;
  tense: EmailTense;
}

/**
 * Builds the full email-image HTML (1280x720). Throws when the movement type has no
 * template, when there are no employees, or when more than three are supplied.
 */
export function buildEmailImageHtml(input: EmailImageInput): EmailImageBuild {
  const category = emailCategory(input.movementType);
  if (!category) {
    throw new Error(
      "This movement type does not have an email template yet. Email images are available for transfers and assignments."
    );
  }
  const employees = input.employees;
  if (employees.length === 0) throw new Error("At least one employee is required.");
  if (employees.length > 3) throw new Error("An announcement email supports at most three employees.");

  const plural = employees.length > 1;
  const lead = employees[0];
  const leadDate = primaryDate(category, lead) ?? input.announcementDate;
  const tense = emailTense(leadDate, input.announcementDate);
  const bg = backgroundDataUri(tense);

  const title = titleText(category, plural);
  const intro = introText(category, plural, tense);
  const effective = effectiveText(category, plural, tense, lead);
  const closing = closingText(category, employees);

  const head = `<meta charset="utf-8"><style>
    ${calibriFontFaceCss()}
    * { margin:0; padding:0; box-sizing:border-box; }
    html,body { width:1280px; height:720px; }
    .slide { position:relative; width:1280px; height:720px; overflow:hidden;
             font-family: 'Calibri', 'Carlito', Arial, Helvetica, sans-serif; color:${NAVY};
             background-image:url('${bg}'); background-size:1280px 720px; background-repeat:no-repeat; }
    .title { position:absolute; left:183px; top:42px; font-size:26px; font-weight:700; line-height:1.25; }
    .internal { position:absolute; left:60px; top:672px; font-size:15px; font-weight:700;
                color:${INTERNAL_TEAL}; letter-spacing:.3px; }
    .ch { font-size:17px; font-weight:700; color:${NAVY}; margin-bottom:3px; }
    .row { display:flex; font-size:15.5px; line-height:1.5; color:${NAVY}; }
    .rl { width:118px; } .rc { width:14px; } .rv { flex:1; }
    .gap { height:12px; }
    ${plural ? multiCss(employees.length) : singleCss()}
  </style>`;

  const body = plural ? multiBody(employees, intro, effective, closing) : singleBody(lead, intro, effective, closing);

  const html = `<!doctype html><html><head>${head}</head><body>
    <div class="slide">
      <div class="title">Company Announcement:<br>${title}</div>
      ${body}
      <div class="internal">FOR INTERNAL USE ONLY</div>
    </div>
  </body></html>`;

  return { html, category, tense };
}

/* ---- single-employee layout (photo left, From/To card right) ---- */

function singleCss(): string {
  return `
    .intro { position:absolute; left:80px; top:150px; width:1120px; font-size:17.5px; line-height:1.6; }
    .panel { position:absolute; left:58px; top:262px; width:1164px; height:372px;
             background:rgba(203,230,246,0.55); border-radius:22px; }
    .photo { position:absolute; left:96px; top:318px; width:132px; height:132px; border-radius:50%;
             object-fit:cover; border:2px solid #6a78c4; background:#dfeaf3; }
    .name { position:absolute; left:258px; top:368px; width:280px; text-align:center;
            font-size:19px; font-weight:700; }
    .eff { position:absolute; left:80px; top:492px; width:520px; font-size:16.5px; }
    .closing { position:absolute; left:80px; top:534px; width:530px; font-size:15px; line-height:1.55; }
    .card { position:absolute; left:648px; top:292px; width:548px; height:312px;
            border:1.6px solid #5b6bbf; border-radius:16px; padding:20px 26px; }`;
}

function singleBody(emp: EmailEmployeeInput, intro: string, effective: string, closing: string): string {
  return `
    <div class="intro">Dear All Employees,<br><br>${escapeHtml(intro)}</div>
    <div class="panel"></div>
    <img class="photo" src="${emp.photoDataUri}">
    <div class="name">${escapeHtml(personName(emp))}</div>
    <div class="eff">${effective}</div>
    <div class="closing">${escapeHtml(closing)}</div>
    <div class="card">${fromToCard(emp)}</div>`;
}

/* ---- multiple-employee layout (centered intro, N columns, centered effective/closing) ---- */

function multiCss(count: number): string {
  // Tighten typography for three columns so the From/To rows still fit; a flex column
  // between the header and footer keeps the effective/closing lines from overlapping.
  const three = count >= 3;
  const rowFont = three ? 12 : 14;
  const rowLh = three ? 1.4 : 1.5;
  const chFont = three ? 13.5 : 16;
  const rlWidth = three ? 88 : 112;
  const photo = three ? 92 : 108;
  const nameFont = three ? 15.5 : 18;
  const cardPad = three ? "12px 16px" : "14px 20px";
  const colMax = three ? 372 : 540;
  return `
    .content { position:absolute; left:40px; top:104px; width:1200px; height:562px;
               display:flex; flex-direction:column; }
    .intro { text-align:center; font-size:15.5px; line-height:1.5; margin-bottom:12px; }
    .cols { flex:1; min-height:0; display:flex; gap:24px; justify-content:center; align-items:flex-start; }
    .col { flex:1; display:flex; flex-direction:column; align-items:center; max-width:${colMax}px; }
    .photo { width:${photo}px; height:${photo}px; border-radius:50%; object-fit:cover;
             border:2px solid #6a78c4; background:#dfeaf3; margin-bottom:8px; }
    .name { font-size:${nameFont}px; font-weight:700; margin-bottom:8px; text-align:center; }
    .card { width:100%; background:rgba(203,230,246,0.55); border:1.4px solid #5b6bbf;
            border-radius:16px; padding:${cardPad}; }
    .card .row { font-size:${rowFont}px; line-height:${rowLh}; }
    .card .ch { font-size:${chFont}px; }
    .card .rl { width:${rlWidth}px; }
    .card .gap { height:10px; }
    .eff { text-align:center; font-size:15.5px; margin-top:12px; }
    .closing { text-align:center; font-size:13.5px; line-height:1.45; margin-top:6px; }`;
}

function multiBody(
  employees: EmailEmployeeInput[],
  intro: string,
  effective: string,
  closing: string
): string {
  const cols = employees
    .map(
      (emp) => `
        <div class="col">
          <img class="photo" src="${emp.photoDataUri}">
          <div class="name">${escapeHtml(personName(emp))}</div>
          <div class="card">${fromToCard(emp)}</div>
        </div>`
    )
    .join("");
  return `
    <div class="content">
      <div class="intro">Dear All Employees,<br>${escapeHtml(intro)}</div>
      <div class="cols">${cols}</div>
      <div class="eff">${effective}</div>
      <div class="closing">${escapeHtml(closing)}</div>
    </div>`;
}
