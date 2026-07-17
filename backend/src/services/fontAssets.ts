import fs from "node:fs";
import path from "node:path";

/**
 * Carlito is the metric-compatible open-source clone of Calibri (SIL OFL). It is
 * embedded as @font-face data URIs so the PDF/PNG renderers produce true Calibri
 * metrics even though the headless Chromium has no Calibri installed.
 */

let css: string | null = null;

function dataUri(file: string): string {
  const buf = fs.readFileSync(path.join(__dirname, "..", "..", "assets", file));
  return `data:font/woff2;base64,${buf.toString("base64")}`;
}

/** @font-face declarations for the "Calibri" family (Carlito). Cached after first read. */
export function calibriFontFaceCss(): string {
  if (!css) {
    const regular = dataUri("carlito-regular.woff2");
    const bold = dataUri("carlito-bold.woff2");
    css = `
      @font-face {
        font-family: 'Calibri';
        font-style: normal;
        font-weight: 400;
        src: url('${regular}') format('woff2');
      }
      @font-face {
        font-family: 'Calibri';
        font-style: normal;
        font-weight: 700;
        src: url('${bold}') format('woff2');
      }`;
  }
  return css;
}
