import { prisma } from "../lib/prisma";

const DEFAULT_START_SEQ = 2001;

/** Extracts the leading numeric sequence from an existing announcement number, e.g. "2016/ A/ ITM/ HR/ 6/ 2026" -> 2016. */
function parseSeq(number: string): number | null {
  const match = number.match(/^\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

export async function nextAnnouncementSequence(): Promise<number> {
  const existing = await prisma.announcement.findMany({ select: { number: true } });
  const seqs = existing.map((a) => parseSeq(a.number)).filter((n): n is number => n !== null);
  if (seqs.length === 0) return DEFAULT_START_SEQ;
  return Math.max(...seqs) + 1;
}

/** Renders the numbering format from settings, e.g. "{seq}/ A/ ITM/ HR/ {month}/ {year}". */
export function renderAnnouncementNumber(
  format: string,
  input: { seq: number; date: Date }
): string {
  return format
    .replace("{seq}", String(input.seq))
    .replace("{month}", String(input.date.getUTCMonth() + 1))
    .replace("{year}", String(input.date.getUTCFullYear()));
}

export async function generateAnnouncementNumber(date: Date): Promise<string> {
  const settings = await prisma.setting.findUnique({ where: { id: 1 } });
  const format = settings?.numberingFormat ?? "{seq}/ A/ ITM/ HR/ {month}/ {year}";
  const seq = await nextAnnouncementSequence();
  return renderAnnouncementNumber(format, { seq, date });
}
