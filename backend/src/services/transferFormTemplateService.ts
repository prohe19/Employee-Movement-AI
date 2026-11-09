import fs from "node:fs";
import path from "node:path";
import { formatLetterDate } from "../lib/dateFormat";
import { calibriFontFaceCss } from "./fontAssets";

/**
 * Renders the ITM Employee Transfer Form (single employee) as HTML for PDF output.
 * Section 2 (Employee Information) is filled from the entered data; the transfer-type
 * and verification checkboxes reflect the user's selections; all signature/approval
 * blocks are left blank for wet signatures after printing.
 */

let logoUri: string | null = null;
function itmLogo(): string {
  if (!logoUri) {
    const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "itm-logo.jpg"));
    logoUri = `data:image/jpeg;base64,${buf.toString("base64")}`;
  }
  return logoUri;
}

export interface FromTo {
  from: string;
  to: string;
}

export interface TransferFormVerification {
  mpp: boolean;
  orgStructureJe: boolean;
  competencyGap: boolean;
  jpGap: boolean;
  yearInPosition: boolean;
  transferReason: boolean;
  others: boolean;
}

export interface TransferFormData {
  docNumber: string;
  transferType: "between_companies" | "within_company" | null;
  employeeName: string;
  employeeId: string;
  levelJs: string;
  levelJp: string;
  position: FromTo;
  costCenter: FromTo;
  section: FromTo;
  department: FromTo;
  division: FromTo;
  location: FromTo;
  company: FromTo;
  effectiveDate: Date | null;
  verification: TransferFormVerification;
}

function esc(v: string | null | undefined): string {
  return (v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** A ticked or empty checkbox glyph. */
function box(checked: boolean): string {
  return `<span class="cbox">${checked ? "&#10003;" : ""}</span>`;
}

const VERIFICATION_ITEMS: { key: keyof TransferFormVerification; label: string }[] = [
  { key: "mpp", label: "Shall refer to the Approved Manpower Planning (MPP)" },
  { key: "orgStructureJe", label: "Shall refer Organization Structure and supported by Job Evaluation (JE)" },
  { key: "competencyGap", label: "No gap in the Primary Competency in the intended (future) position" },
  {
    key: "jpGap",
    label:
      "Gap between JP the designated position maximum 1 (one) level higher than JS of the Employee and not a promotional transfer",
  },
  { key: "yearInPosition", label: "The year in position should be minimum 1 year" },
  {
    key: "transferReason",
    label:
      "The transfer conducted due to manpower need, operational expansion or change in strategy, vision, and mission of the company",
  },
  { key: "others", label: "Others" },
];

/** A blank "Signature / Name / Position / Date" sign-off block. */
function signBlock(heading: string): string {
  const line = (label: string) =>
    `<tr><td class="sl">${label}</td><td class="sc">:</td><td class="sv"></td></tr>`;
  return `
    <div class="signblock">
      <div class="signhead">${heading}</div>
      <table class="signtable">
        ${line("Signature")}
        ${line("Name")}
        ${line("Position")}
        ${line("Date")}
      </table>
    </div>`;
}

/** A "from : ___ to : ___" data row in Section 2. */
function fromToRow(label: string, ft: FromTo): string {
  return `
    <tr>
      <td class="f-label">${label}</td>
      <td class="f-colon">:</td>
      <td class="f-ft">from</td>
      <td class="f-val">${esc(ft.from)}</td>
      <td class="f-ft">to</td>
      <td class="f-val">${esc(ft.to)}</td>
    </tr>`;
}

export function renderTransferFormHtml(data: TransferFormData): string {
  const v = data.verification;
  const eff = data.effectiveDate ? formatLetterDate(data.effectiveDate) : "";
  const level = [data.levelJs, data.levelJp].map((s) => (s ?? "").trim()).filter(Boolean).join(" / ");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
  ${calibriFontFaceCss()}
  @page { size: A4 portrait; margin: 8mm 9mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: 'Calibri', 'Carlito', Arial, sans-serif; color: #111; font-size: 8.5pt; line-height: 1.18; }
  table { border-collapse: collapse; width: 100%; }
  /* document-control header (ITM-F-HR-001) */
  .docctrl { margin-bottom: 5px; }
  .docctrl td { border: 1px solid #333; padding: 2px 6px; vertical-align: middle; }
  .docctrl .dc-logo { width: 22%; text-align: center; }
  .docctrl .dc-logo img { height: 28px; display: inline-block; }
  .docctrl .dc-hr { text-align: center; font-weight: 700; font-size: 11pt; line-height: 1.02; white-space: nowrap; }
  .docctrl .dc-et { text-align: center; font-weight: 700; font-size: 11pt; letter-spacing: .3px; }
  .docctrl .dc-fn { text-align: center; font-weight: 700; }
  .docctrl .dc-fn b { display: block; font-size: 10pt; }
  .docctrl .dc-l { width: 76px; }
  .cbox { display: inline-block; width: 10px; height: 10px; border: 1px solid #333; text-align: center;
          line-height: 9px; font-size: 8px; margin-right: 5px; vertical-align: middle; }
  .toprow td { border: 1px solid #333; padding: 3px 6px; vertical-align: middle; }
  .sec-title { background: #D9E2F3; border: 1px solid #333; font-weight: 700; padding: 2px 6px; margin-top: 4px; }
  /* Section 2 */
  .info td { border: 1px solid #333; padding: 2px 6px; vertical-align: middle; }
  .info .f-label { width: 130px; } .info .f-colon { width: 10px; } .info .f-ft { width: 26px; color: #555; }
  .info .f-val { min-width: 120px; }
  /* verification */
  .verify td { border: 1px solid #333; padding: 2px 6px; vertical-align: top; }
  .verify .vk { width: 26px; text-align: center; }
  /* sign blocks */
  .signrow { display: flex; gap: 6px; margin-top: 4px; }
  .signblock { flex: 1; border: 1px solid #333; padding: 4px 6px; }
  .signhead { font-weight: 700; margin-bottom: 2px; }
  .signtable td { border: none; padding: 1px 0; }
  .signtable .sl { width: 60px; } .signtable .sc { width: 8px; }
  .signtable .sv { border-bottom: 1px solid #999; height: 12px; }
  .remark { border: 1px solid #333; padding: 4px 6px; min-height: 48px; }
  .notes { margin-top: 6px; font-size: 8pt; color: #333; }
  .notes b { color: #111; }
</style>
</head>
<body>
  <table class="docctrl">
    <tr>
      <td class="dc-logo" colspan="2"><img src="${itmLogo()}" alt="ITM" /></td>
      <td class="dc-hr">HR<br />FORM</td>
      <td class="dc-fn" colspan="2">Form Number<b>ITM-F-HR-001</b></td>
    </tr>
    <tr>
      <td class="dc-l">Issued Date</td>
      <td>1 November 2018</td>
      <td class="dc-et" rowspan="2">EMPLOYEE TRANSFER</td>
      <td class="dc-l">Revision</td>
      <td>1</td>
    </tr>
    <tr>
      <td class="dc-l">Page</td>
      <td>Page 1 of 1</td>
      <td class="dc-l">Revision Date</td>
      <td>&ndash;</td>
    </tr>
  </table>

  <table class="toprow">
    <tr>
      <td style="width:38%">${box(data.transferType === "between_companies")} Transfer between Companies &amp; Dept Head Level and Up</td>
      <td style="width:38%">${box(data.transferType === "within_company")} Transfer within Company &amp; Level Superintendent and below</td>
      <td>Doc Number : ${esc(data.docNumber)}</td>
    </tr>
  </table>

  <div class="sec-title">1) Requester / Designated Superior</div>
  <div class="signrow">
    ${signBlock("")}
    <div class="signblock" style="flex:1"><div class="signhead">Remark:</div><div class="remark"></div></div>
  </div>

  <div class="sec-title">2) Employee Information</div>
  <table class="info">
    <tr><td class="f-label">Employee&rsquo;s Name</td><td class="f-colon">:</td><td colspan="4">${esc(data.employeeName)}</td></tr>
    <tr><td class="f-label">Employee&rsquo;s ID</td><td class="f-colon">:</td><td colspan="4">${esc(data.employeeId)}</td></tr>
    <tr><td class="f-label">Level ( JS / JP )</td><td class="f-colon">:</td><td colspan="4">${esc(level)}</td></tr>
    ${fromToRow("Position", data.position)}
    ${fromToRow("Cost Center", data.costCenter)}
    ${fromToRow("Section", data.section)}
    ${fromToRow("Department", data.department)}
    ${fromToRow("Division", data.division)}
    ${fromToRow("Location", data.location)}
    ${fromToRow("Company", data.company)}
    <tr><td class="f-label">Effective Date of transfer</td><td class="f-colon">:</td><td colspan="4">${esc(eff)}</td></tr>
  </table>

  <div class="sec-title">3) Verification Transfer (Check by HR)</div>
  <table class="verify">
    ${VERIFICATION_ITEMS.map(
      (item) => `<tr><td class="vk">${box(v[item.key])}</td><td>${item.label}</td></tr>`
    ).join("")}
  </table>
  <div class="signrow">
    ${signBlock("HR (existing) (1)")}
    ${signBlock("HR (designated) (1)")}
  </div>

  <div class="signrow">
    ${signBlock("4) Existing Superior")}
    ${signBlock("5) Acknowledged by Employee")}
  </div>

  <div class="sec-title">6) Approval - by DoA (2)</div>
  <div class="signrow">
    ${signBlock("Existing (1)")}
    ${signBlock("Designated (1)")}
  </div>

  <div class="notes">
    <b>Note:</b><br />
    If transfer within company, use only Existing part.<br />
    Follow DoA for Employee Transfer &amp; Temporary Assignment (see DoA Table point 2.7)
  </div>
</body>
</html>`;
}
