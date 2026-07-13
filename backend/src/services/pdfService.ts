import puppeteer, { Browser } from "puppeteer";
import { env } from "../config/env";
import { renderLetterHtml, type LetterData } from "./letterTemplateService";

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // In Docker/production, use the system-installed Chromium.
      executablePath: env.puppeteerExecutablePath || undefined,
    });
  }
  return browserPromise;
}

export async function renderLetterPdf(data: LetterData): Promise<Buffer> {
  const html = renderLetterHtml(data);
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

export async function closePdfEngine(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
}
