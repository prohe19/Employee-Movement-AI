// Per-company letterhead options for the announcement letter.
// Keys must match the backend registry in letterheads.ts.

export const LETTERHEADS: { key: string; label: string }[] = [
  { key: "ITM", label: "PT Indo Tambangraya Megah" },
  { key: "BEK", label: "PT Bharinto Ekatama" },
  { key: "CPI", label: "PT Cahaya Power Indonesia" },
  { key: "EBP", label: "PT Energi Batubara Perkasa" },
  { key: "GPK", label: "PT Graha Panca Karsa" },
  { key: "IBP", label: "PT ITM Bhinneka Power" },
  { key: "IMM", label: "PT Indominco Mandiri" },
  { key: "JBG", label: "PT Jorong Barutama Greston" },
  { key: "KTD", label: "PT Kitadin Embalut" },
  { key: "NPR", label: "PT Nusa Persada Resources" },
  { key: "TCM", label: "PT Trubaindo Coal Mining" },
  { key: "TIS", label: "PT Tepian Indah Sukses" },
  { key: "TRUST", label: "PT Tambang Raya Usaha Tama" },
];

export const DEFAULT_LETTERHEAD_KEY = "ITM";
