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

/** Renders an HTML document to a PNG buffer at the given pixel size (default 1280x720). */
export async function renderHtmlToPng(
  html: string,
  width = 1280,
  height = 720
): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "load" });
    const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
    return Buffer.from(png);
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
