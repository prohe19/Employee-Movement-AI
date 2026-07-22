import fs from "node:fs";
import path from "node:path";

/**
 * Per-company letterhead backgrounds for the announcement letter (full A4 image
 * with the company logo top-right and address bottom-left). `key` is stored on
 * the announcement; `label` is shown in the picker.
 */
export interface Letterhead {
  key: string;
  label: string;
  file: string;
}

export const LETTERHEADS: Letterhead[] = [
  { key: "ITM", label: "PT Indo Tambangraya Megah", file: "ITM.jpg" },
  { key: "BEK", label: "PT Bharinto Ekatama", file: "BEK.jpg" },
  { key: "CPI", label: "PT Cahaya Power Indonesia", file: "CPI.jpg" },
  { key: "EBP", label: "PT Energi Batubara Perkasa", file: "EBP.jpg" },
  { key: "GPK", label: "PT Graha Panca Karsa", file: "GPK.jpg" },
  { key: "IBP", label: "PT ITM Bhinneka Power", file: "IBP.jpg" },
  { key: "IMM", label: "PT Indominco Mandiri", file: "IMM.jpg" },
  { key: "JBG", label: "PT Jorong Barutama Greston", file: "JBG.jpg" },
  { key: "KTD", label: "PT Kitadin Embalut", file: "KTD.jpg" },
  { key: "NPR", label: "PT Nusa Persada Resources", file: "NPR.jpg" },
  { key: "TCM", label: "PT Trubaindo Coal Mining", file: "TCM.jpg" },
  { key: "TIS", label: "PT Tepian Indah Sukses", file: "TIS.jpg" },
  { key: "TRUST", label: "PT Tambang Raya Usaha Tama", file: "TRUST.jpg" },
];

export const DEFAULT_LETTERHEAD_KEY = "ITM";

const cache = new Map<string, string>();

/** Resolves a letterhead key to a data URI, falling back to the ITM letterhead. */
export function letterheadDataUri(key: string | null | undefined): string {
  const lh = LETTERHEADS.find((l) => l.key === key) ?? LETTERHEADS[0];
  const cached = cache.get(lh.key);
  if (cached) return cached;
  const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "letterheads", lh.file));
  const uri = `data:image/jpeg;base64,${buf.toString("base64")}`;
  cache.set(lh.key, uri);
  return uri;
}
