import fs from "node:fs";
import path from "node:path";

/**
 * The selectable "{CODE} HR" badge logos shown at the top-right of the body-email
 * image. `key` is stored on the announcement; `label` is shown in the picker.
 */
export interface EmailLogo {
  key: string;
  label: string;
  file: string;
}

export const EMAIL_LOGOS: EmailLogo[] = [
  { key: "ITM", label: "ITM HR — PT Indo Tambangraya Megah", file: "Logo-ITM-HR-Color.png" },
  { key: "BEK", label: "BEK HR — PT Bharinto Ekatama", file: "Logo-BEK-HR-Color.png" },
  { key: "CPI", label: "CPI HR — PT Cahaya Power Indonesia", file: "Logo-CPI-HR.png" },
  { key: "EBP", label: "EBP HR — PT Energi Batubara Perkasa", file: "Logo-EBP-HR-Color.png" },
  { key: "GPK", label: "GPK HR — PT Graha Panca Karsa", file: "Logo-GPK-HR.png" },
  { key: "IBP", label: "IBP HR — PT ITM Bhinneka Power", file: "Logo-IBP-HR.png" },
  { key: "IMM", label: "IMM HR — PT Indominco Mandiri", file: "Logo-IMM-HR.png" },
  { key: "JBG", label: "JBG HR — PT Jorong Barutama Greston", file: "Logo-JBG-HR.png" },
  { key: "KTD", label: "KTD HR — PT Kitadin Embalut", file: "Logo-KTD-HR.png" },
  { key: "NPR", label: "NPR HR — PT Nusa Persada Resources", file: "Logo-NPR-HR.png" },
  { key: "TCM", label: "TCM HR — PT Trubaindo Coal Mining", file: "Logo-TCM-HR.png" },
  { key: "TIS", label: "TIS HR — PT Tepian Indah Sukses", file: "Logo-TIS-HR.png" },
  { key: "TRUST", label: "TRUST HR — PT Tambang Raya Usaha Tama", file: "Logo-TRUST-HR.png" },
  { key: "BPN", label: "BPN HR — Balikpapan", file: "Logo-BPN-HR.png" },
];

export const DEFAULT_EMAIL_LOGO_KEY = "ITM";

const cache = new Map<string, string>();

/** Resolves a logo key to a data URI, falling back to the ITM logo for unknown keys. */
export function emailLogoDataUri(key: string | null | undefined): string {
  const logo = EMAIL_LOGOS.find((l) => l.key === key) ?? EMAIL_LOGOS[0];
  const cached = cache.get(logo.key);
  if (cached) return cached;
  const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", "logos", logo.file));
  const uri = `data:image/png;base64,${buf.toString("base64")}`;
  cache.set(logo.key, uri);
  return uri;
}
