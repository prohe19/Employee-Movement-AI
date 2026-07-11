import { describe, expect, it } from "vitest";
import {
  buildAssignmentDateSentence,
  buildEffectiveDateSentence,
  buildNarration,
  computeTense,
} from "./narrationService";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe("computeTense", () => {
  it("is future when effective date is after announcement date", () => {
    expect(computeTense(d("2026-06-01"), d("2026-05-01"))).toBe("future");
  });
  it("is present when effective date equals announcement date", () => {
    expect(computeTense(d("2026-05-01"), d("2026-05-01"))).toBe("present");
  });
  it("is past when effective date is before announcement date", () => {
    expect(computeTense(d("2026-04-01"), d("2026-05-01"))).toBe("past");
  });
});

describe("buildEffectiveDateSentence", () => {
  it("future", () => {
    expect(buildEffectiveDateSentence(d("2026-06-25"), d("2026-05-01"))).toBe(
      "This announcement will be effective as of June 25th, 2026."
    );
  });
  it("present", () => {
    expect(buildEffectiveDateSentence(d("2026-05-01"), d("2026-05-01"))).toBe(
      "This announcement is effective as of May 1st, 2026."
    );
  });
  it("past", () => {
    expect(buildEffectiveDateSentence(d("2026-04-01"), d("2026-05-01"))).toBe(
      "This announcement has been effective since April 1st, 2026."
    );
  });
});

describe("buildAssignmentDateSentence", () => {
  it("blocks generation when the assignment already ended before the announcement date", () => {
    const result = buildAssignmentDateSentence(d("2025-01-01"), d("2025-06-01"), d("2026-05-01"));
    expect(result.blocked).toBe(true);
    expect(result.sentence).toMatch(/ended before the announcement date/);
  });

  it("matches the spec example: started before, continuing", () => {
    const result = buildAssignmentDateSentence(d("2026-05-15"), d("2027-05-14"), d("2026-06-25"));
    expect(result.blocked).toBe(false);
    expect(result.sentence).toBe(
      "The assignment has been effective from May 15th, 2026 and will continue until May 14th, 2027."
    );
  });

  it("not started yet", () => {
    const result = buildAssignmentDateSentence(d("2026-08-01"), d("2027-08-01"), d("2026-06-25"));
    expect(result.sentence).toBe("The assignment will be effective from August 1st, 2026 to August 1st, 2027.");
  });

  it("starts on the announcement date", () => {
    const result = buildAssignmentDateSentence(d("2026-06-25"), d("2027-06-25"), d("2026-06-25"));
    expect(result.sentence).toBe("The assignment is effective from June 25th, 2026 to June 25th, 2027.");
  });
});

describe("buildNarration", () => {
  it("builds the Lucas Manurung temporary assignment example from the design spec", () => {
    const result = buildNarration(
      "TemporaryAssignment",
      [
        {
          employeeName: "Lucas Manurung",
          currentPosition: "Technical Specialist",
          newPosition: "Port",
          newCompany: "PT Indominco Mandiri",
          newLocation: "Bontang Site",
          currentCompany: "PT Indominco Mandiri",
          currentLocation: "Bontang Site",
          effectiveDate: null,
          assignmentStartDate: d("2026-05-15"),
          assignmentEndDate: d("2027-05-14"),
        },
      ],
      d("2026-06-25")
    );

    expect(result.blocked).toBe(false);
    expect(result.narrationText).toBe(
      "• Lucas Manurung has been assigned from Technical Specialist to Port, PT Indominco Mandiri, Bontang Site."
    );
    expect(result.effectiveSentence).toBe(
      "The assignment has been effective from May 15th, 2026 and will continue until May 14th, 2027."
    );
  });

  it("blocks when a temporary assignment is missing its end date", () => {
    const result = buildNarration(
      "TemporaryAssignment",
      [
        {
          employeeName: "Jane Doe",
          currentPosition: "Analyst",
          newPosition: "Senior Analyst",
          newCompany: "PT ITM",
          newLocation: "Jakarta",
          currentCompany: "PT ITM",
          currentLocation: "Jakarta",
          effectiveDate: null,
          assignmentStartDate: d("2026-05-15"),
          assignmentEndDate: null,
        },
      ],
      d("2026-06-25")
    );
    expect(result.blocked).toBe(true);
  });

  it("builds a Transfer sentence in future tense", () => {
    const result = buildNarration(
      "Transfer",
      [
        {
          employeeName: "John Smith",
          currentPosition: "Engineer",
          newPosition: "Senior Engineer",
          newCompany: "PT ITM",
          newLocation: "Jakarta",
          currentCompany: "PT ITM",
          currentLocation: "Bontang",
          effectiveDate: d("2026-07-01"),
          assignmentStartDate: null,
          assignmentEndDate: null,
        },
      ],
      d("2026-06-25")
    );
    expect(result.narrationText).toBe(
      "• John Smith will be transferred from Engineer to Senior Engineer, PT ITM, Jakarta."
    );
    expect(result.effectiveSentence).toBe("This announcement will be effective as of July 1st, 2026.");
  });
});
