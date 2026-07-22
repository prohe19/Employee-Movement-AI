import type { MovementType } from "@prisma/client";
import { formatLetterDate } from "../lib/dateFormat";
import { calibriFontFaceCss } from "./fontAssets";
import { letterheadDataUri } from "./letterheads";

const MOVEMENT_TITLES: Record<MovementType, string> = {
  Transfer: "Employee's Transfer",
  Assignment: "Employee's Assignment",
};

const MOVEMENT_NOUN: Record<MovementType, string> = {
  Transfer: "transfer",
  Assignment: "assignment",
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
  /** Company key selecting the letterhead background; defaults to ITM. */
  letterheadKey?: string | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderLetterHtml(data: LetterData): string {
  // Each movement sentence is its own justified paragraph (no bullets), matching the
  // real ITM letter.
  const movementParas = data.narrationLines
    .map((line) => `<p class="para movement">${escapeHtml(line)}</p>`)
    .join("");

  const signatureImg = data.signatureImageUrl
    ? `<img class="signature" src="${data.signatureImageUrl}" alt="signature" />`
    : `<div class="signature-space"></div>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${calibriFontFaceCss()}
  @page { size: A4 portrait; margin: 0; }
  html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
  * { box-sizing: border-box; }
  body {
    position: relative;
    font-family: 'Calibri', 'Carlito', Arial, sans-serif;
    color: #111;
    background-image: url('${letterheadDataUri(data.letterheadKey)}');
    background-size: 210mm 297mm;
    background-repeat: no-repeat;
  }
  /* 1-inch (25.4mm) margins all round, matching the source document. */
  .content { position: absolute; left: 25.4mm; right: 25.4mm; top: 16mm; }
  .header { text-align: center; }
  .header .line { font-size: 16pt; line-height: 1.3; color: #111; }
  .header .title { font-weight: 700; }
  .body { margin-top: 26pt; font-size: 11pt; line-height: 1.3; color: #1a1a1a; }
  .body .para { margin: 0 0 12pt 0; }
  .movement { font-size: 10.5pt; text-align: justify; }
  .datesign { margin-top: 12pt; }
  .datesign .para { margin: 0; }
  .signature-space { height: 46pt; }
  .signature { height: 46pt; object-fit: contain; margin: 6pt 0; }
  .signatory-name { font-weight: 700; color: #111; }
</style>
</head>
<body>
  <div class="content">
    <div class="header">
      <div class="line title">Announcement</div>
      <div class="line">${escapeHtml(data.announcementNumber)}</div>
      <div class="line">${escapeHtml(movementTitle(data.movementType))}</div>
      <div class="line">${escapeHtml(data.companyName)}</div>
    </div>
    <div class="body">
      <p class="para">Dear All Employees,</p>
      <p class="para">${escapeHtml(OPENING_PARAGRAPH(data.movementType))}</p>
      ${movementParas}
      <p class="para">${escapeHtml(data.effectiveSentence)}</p>
      <div class="datesign">
        <p class="para">${escapeHtml(data.city)}, ${formatLetterDate(data.announcementDate)}.</p>
        <p class="para">Approved by,</p>
      </div>
      ${signatureImg}
      <div class="signatory-name">${escapeHtml(data.signatoryName)}</div>
      <div>${escapeHtml(data.signatoryTitle)}</div>
    </div>
  </div>
</body>
</html>`;
}

export { FOOTER_ADDRESS };
