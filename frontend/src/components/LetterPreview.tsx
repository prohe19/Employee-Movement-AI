import { MOVEMENT_TYPE_LABELS } from "../lib/format";
import type { MovementType } from "../api/types";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ordinal(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

function letterDate(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getUTCDate();
  return `${MONTHS[d.getUTCMonth()]} ${day}${ordinal(day)}, ${d.getUTCFullYear()}`;
}

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

export interface LetterPreviewData {
  announcementNumber: string;
  movementType: MovementType;
  companyName: string;
  narrationLines: string[];
  effectiveSentence: string;
  city: string;
  announcementDate: string;
  signatoryName: string;
  signatoryTitle: string;
}

/**
 * The official ITM letterhead preview (white, corporate — NOT the neon theme).
 * Uses the letterhead PNG served by the backend at /assets/letterhead.png.
 */
export function LetterPreview({ data, width = 520 }: { data: LetterPreviewData; width?: number }) {
  const letterheadUrl = `${import.meta.env.VITE_API_BASE_URL ?? "/api"}/assets/letter_memo_2125.png`;
  return (
    <div
      style={{
        position: "relative",
        width,
        aspectRatio: "1653 / 2338",
        background: "#ffffff",
        boxShadow: "0 20px 50px -12px rgba(0,0,0,0.6)",
        overflow: "hidden",
      }}
    >
      <img src={letterheadUrl} alt="ITM letterhead" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      <div
        style={{
          position: "absolute",
          left: "11.15%",
          right: "11.15%",
          top: "6.4%",
          fontFamily: "'Helvetica Neue', Arial, sans-serif",
          color: "#1c1c28",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.05em", fontWeight: 700, color: "#111" }}>Announcement</div>
          <div style={{ fontSize: "0.85em", color: "#222", marginTop: 4 }}>{data.announcementNumber}</div>
          <div style={{ fontSize: "0.95em", fontWeight: 700, color: "#111", marginTop: 11 }}>
            {MOVEMENT_TYPE_LABELS[data.movementType]}
          </div>
          <div style={{ fontSize: "0.8em", color: "#222", marginTop: 2 }}>{data.companyName}</div>
        </div>
        <div style={{ marginTop: 22, fontSize: "0.82em", lineHeight: 1.75, color: "#1f2430" }}>
          <div>Dear All Employees,</div>
          <div style={{ marginTop: 11 }}>
            In order to strengthen our operations in PT Indo Tambang Raya Megah, Tbk and its subsidiaries, this is to
            announce this employee's {MOVEMENT_NOUN[data.movementType]} as follows:
          </div>
          {data.narrationLines.map((line, i) => (
            <div key={i} style={{ display: "flex", gap: 7, marginTop: 11 }}>
              <span>&bull;</span>
              <span>{line}</span>
            </div>
          ))}
          {data.effectiveSentence && <div style={{ marginTop: 11 }}>{data.effectiveSentence}</div>}
          <div style={{ marginTop: 20 }}>
            {data.city}, {letterDate(data.announcementDate)}.
          </div>
          <div style={{ marginTop: 13 }}>Approved by,</div>
          <div style={{ height: 40 }} />
          <div style={{ fontWeight: 700, color: "#111" }}>{data.signatoryName}</div>
          <div>{data.signatoryTitle}</div>
        </div>
      </div>
    </div>
  );
}
