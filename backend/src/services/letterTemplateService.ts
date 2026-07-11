import fs from "node:fs";
import path from "node:path";
import type { MovementType } from "@prisma/client";
import { formatLetterDate } from "../lib/dateFormat";

const LETTERHEAD_PATH = path.join(__dirname, "..", "..", "assets", "letter_memo_2125.png");

let letterheadDataUri: string | null = null;
function getLetterheadDataUri(): string {
  if (!letterheadDataUri) {
    const buf = fs.readFileSync(LETTERHEAD_PATH);
    letterheadDataUri = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return letterheadDataUri;
}

const MOVEMENT_TITLES: Record<MovementType, string> = {
  Transfer: "Employee's Transfer",
  TemporaryAssignment: "Employee's Temporary Assignment",
  PermanentAssignment: "Employee's Permanent Assignment",
  Rotation: "Employee's Rotation",
  LateralMovement: "Employee's Lateral Movement",
  ChangeOfPosition: "Employee's Change of Position",
  ChangeOfLocation: "Employee's Change of Location",
  ChangeOfCompany: "Employee's Change of Company",
  ActingAssignment: "Employee's Acting Assignment",
  EndOfAssignment: "Employee's End of Assignment",
  Other: "Employee Movement Announcement",
};

const MOVEMENT_NOUN: Record<MovementType, string> = {
  Transfer: "transfer",
  TemporaryAssignment: "temporary assignment",
  PermanentAssignment: "permanent assignment",
  Rotation: "rotation",
  LateralMovement: "lateral movement",
  ChangeOfPosition: "change of position",
  ChangeOfLocation: "change of location",
  ChangeOfCompany: "change of company",
  ActingAssignment: "acting assignment",
  EndOfAssignment: "end of assignment",
  Other: "movement",
};

export function movementTitle(movementType: MovementType): string {
  return MOVEMENT_TITLES[movementType];
}

const OPENING_PARAGRAPH = (movementType: MovementType) =>
  `In order to strengthen our operations in PT Indo Tambang Raya Megah, Tbk and its subsidiaries, this is to announce this employee's ${MOVEMENT_NOUN[movementType]} as follows:`;

const FOOTER_ADDRESS =
  "PT Indo Tambangraya Megah Tbk · Pondok Indah Office Tower 3, 3rd Floor · Jl. Sultan Iskandar Muda Kav. V-TA, Pondok Pinang, Kebayoran Lama, Jakarta 12310 - Indonesia · T: +62-21 29328100 · www.itmg.co.id";

export interface LetterData {
  announcementNumber: string;
  movementType: MovementType;
  companyName: string;
  narrationLines: string[];
  effectiveSentence: string;
  city: string;
  announcementDate: Date;
  signatoryName: string;
  signatoryTitle: string;
  signatureImageUrl?: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderLetterHtml(data: LetterData): string {
  const bullets = data.narrationLines
    .map((line) => `<div class="bullet"><span class="dot">&bull;</span><span>${escapeHtml(line)}</span></div>`)
    .join("");

  const signatureImg = data.signatureImageUrl
    ? `<img class="signature" src="${data.signatureImageUrl}" alt="signature" />`
    : `<div class="signature-space"></div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
  * { box-sizing: border-box; }
  body {
    position: relative;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1c1c28;
    background-image: url('${getLetterheadDataUri()}');
    background-size: 210mm 297mm;
    background-repeat: no-repeat;
  }
  .content {
    position: absolute;
    left: 3.51%;
    right: 3.51%;
    top: 6.42%;
  }
  .header { text-align: center; }
  .header .title { font-size: 12.5pt; font-weight: 700; color: #111; }
  .header .number { font-size: 10.5pt; color: #222; margin-top: 4pt; }
  .header .announcement-title { font-size: 11.5pt; font-weight: 700; color: #111; margin-top: 11pt; }
  .header .company { font-size: 10pt; color: #222; margin-top: 2pt; }
  .body { margin-top: 22pt; font-size: 10pt; line-height: 1.75; color: #1f2430; }
  .bullet { display: flex; gap: 7pt; margin-top: 11pt; }
  .effective { margin-top: 11pt; }
  .closing { margin-top: 20pt; }
  .approved { margin-top: 13pt; }
  .signature-space { height: 42pt; }
  .signature { height: 42pt; object-fit: contain; }
  .signatory-name { font-weight: 700; color: #111; }
</style>
</head>
<body>
  <div class="content">
    <div class="header">
      <div class="title">Announcement</div>
      <div class="number">${escapeHtml(data.announcementNumber)}</div>
      <div class="announcement-title">${escapeHtml(movementTitle(data.movementType))}</div>
      <div class="company">${escapeHtml(data.companyName)}</div>
    </div>
    <div class="body">
      <div>Dear All Employees,</div>
      <div class="effective">${escapeHtml(OPENING_PARAGRAPH(data.movementType))}</div>
      ${bullets}
      <div class="effective">${escapeHtml(data.effectiveSentence)}</div>
      <div class="closing">${escapeHtml(data.city)}, ${formatLetterDate(data.announcementDate)}.</div>
      <div class="approved">Approved by,</div>
      ${signatureImg}
      <div class="signatory-name">${escapeHtml(data.signatoryName)}</div>
      <div>${escapeHtml(data.signatoryTitle)}</div>
    </div>
  </div>
</body>
</html>`;
}

export { FOOTER_ADDRESS };
