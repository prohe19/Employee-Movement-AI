import { prisma } from "../lib/prisma";

export interface SignatoryResolution {
  signatoryId: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  resolvedFromJs: number | null;
  blocked: boolean;
  reason?: string;
}

/**
 * Signatory is selected from the employees' *current* JS (never new/designated JS).
 * With multiple employees, the highest current JS wins. Thresholds live in the
 * `signatories` table (jsMin/jsMax) so admins can edit them.
 */
export async function resolveSignatory(currentJsValues: (number | null)[]): Promise<SignatoryResolution> {
  const knownJs = currentJsValues.filter((v): v is number => v !== null && v !== undefined);
  if (knownJs.length !== currentJsValues.length || knownJs.length === 0) {
    return {
      signatoryId: null,
      signatoryName: null,
      signatoryTitle: null,
      resolvedFromJs: null,
      blocked: true,
      reason:
        "Signatory cannot be determined because the employee's current JS is missing or unclear.",
    };
  }

  const highestJs = Math.max(...knownJs);

  const candidates = await prisma.signatory.findMany({ where: { isActive: true } });
  const match = candidates.find((s) => {
    const min = s.jsMin ?? Number.NEGATIVE_INFINITY;
    const max = s.jsMax ?? Number.POSITIVE_INFINITY;
    return highestJs >= min && highestJs <= max;
  });

  if (!match) {
    return {
      signatoryId: null,
      signatoryName: null,
      signatoryTitle: null,
      resolvedFromJs: highestJs,
      blocked: true,
      reason: `No signatory rule covers current JS ${highestJs}. Configure signatory JS ranges in Settings.`,
    };
  }

  return {
    signatoryId: match.id,
    signatoryName: match.name,
    signatoryTitle: match.title,
    resolvedFromJs: highestJs,
    blocked: false,
  };
}
