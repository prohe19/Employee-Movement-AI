import { describe, expect, it } from "vitest";
import {
  buildAssignmentDateSentence,
  buildEffectiveDateSentence,
  buildNarration,
  computeTense,
  type NarrationEmployeeInput,
} from "./narrationService";

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

/** Builds a NarrationEmployeeInput with sensible blank defaults for the fields a test doesn't set. */
function emp(overrides: Partial<NarrationEmployeeInput>): NarrationEmployeeInput {
  return {
    title: null,
    employeeName: "Employee",
    currentPosition: null,
    newPosition: null,
    currentDepartment: null,
    newDepartment: null,
    currentDivision: null,
    newDivision: null,
    currentCompany: null,
    newCompany: null,
    currentLocation: null,
    newLocation: null,
    effectiveDate: null,
    assignmentStartDate: null,
    assignmentEndDate: null,
    ...overrides,
  };
}

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
      "This announcement will be effectively applied starting from June 25th, 2026."
    );
  });
  it("present", () => {
    expect(buildEffectiveDateSentence(d("2026-05-01"), d("2026-05-01"))).toBe(
      "This announcement is effectively applied starting from May 1st, 2026."
    );
  });
  it("past", () => {
    expect(buildEffectiveDateSentence(d("2026-04-01"), d("2026-05-01"))).toBe(
      "This announcement has been effectively applied starting from April 1st, 2026."
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

describe("buildNarration — real ITM letters", () => {
  it("0965: transfer across companies with department + division segments (past tense)", () => {
    const result = buildNarration(
      "Transfer",
      [
        emp({
          title: "Mr.",
          employeeName: "Tawatchai Srisawang",
          currentPosition: "Technical Development Services",
          currentDivision: "Mining Business Indonesia",
          currentCompany: "PT Indo Tambangraya Megah Tbk",
          newPosition: "Technical Advisor",
          newDepartment: "Melak Group Head",
          newCompany: "PT Trubaindo Coal Mining",
          effectiveDate: d("2026-01-01"),
        }),
      ],
      d("2026-02-01")
    );
    expect(result.narrationText).toBe(
      "• Mr. Tawatchai Srisawang has been transferred from Technical Development Services, Mining Business Indonesia, PT Indo Tambangraya Megah Tbk to Technical Advisor, Melak Group Head, PT Trubaindo Coal Mining."
    );
  });

  it("1214: same company AND site → the place is stated once at the end (collapse rule)", () => {
    const result = buildNarration(
      "Transfer",
      [
        emp({
          title: "Mr.",
          employeeName: "Budhi Cahyono",
          currentPosition: "HSEC",
          newPosition: "Road Management",
          currentCompany: "PT Trubaindo Coal Mining",
          newCompany: "PT Trubaindo Coal Mining",
          effectiveDate: d("2026-02-01"),
        }),
      ],
      d("2026-02-01")
    );
    expect(result.narrationText).toBe(
      "• Mr. Budhi Cahyono is transferred from HSEC to Road Management, PT Trubaindo Coal Mining."
    );
  });

  it("2054: transfer across companies (present tense)", () => {
    const result = buildNarration(
      "Transfer",
      [
        emp({
          title: "Mr.",
          employeeName: "Danupope S",
          currentPosition: "Operations",
          currentCompany: "PT Bharinto Ekatama",
          newPosition: "Contractor Business",
          newCompany: "PT Tambang Raya Usaha Tama",
          effectiveDate: d("2026-02-01"),
        }),
      ],
      d("2026-02-01")
    );
    expect(result.narrationText).toBe(
      "• Mr. Danupope S is transferred from Operations, PT Bharinto Ekatama to Contractor Business, PT Tambang Raya Usaha Tama."
    );
  });

  it("2300: same company but different site → 'company at site' stated on both sides", () => {
    const result = buildNarration(
      "Transfer",
      [
        emp({
          title: "Mr.",
          employeeName: "Phonprakhal Kerdnual",
          currentPosition: "Technical Advisor",
          currentCompany: "PT Trubaindo Coal Mining",
          currentLocation: "Melak Site",
          newPosition: "Advisor",
          newDivision: "Mining Business Indonesia",
          newCompany: "PT Trubaindo Coal Mining",
          newLocation: "Jakarta Office",
          effectiveDate: d("2026-02-01"),
        }),
      ],
      d("2026-02-01")
    );
    expect(result.narrationText).toBe(
      "• Mr. Phonprakhal Kerdnual is transferred from Technical Advisor, PT Trubaindo Coal Mining at Melak Site to Advisor, Mining Business Indonesia, PT Trubaindo Coal Mining at Jakarta Office."
    );
  });
});

describe("buildNarration — tense and assignments", () => {
  it("builds a Transfer sentence in future tense with the effective sentence", () => {
    const result = buildNarration(
      "Transfer",
      [
        emp({
          title: "Ms.",
          employeeName: "Jane Doe",
          currentPosition: "Engineer",
          newPosition: "Senior Engineer",
          currentCompany: "PT ITM",
          currentLocation: "Bontang",
          newCompany: "PT ITM",
          newLocation: "Jakarta",
          effectiveDate: d("2026-07-01"),
        }),
      ],
      d("2026-06-25")
    );
    expect(result.narrationText).toBe(
      "• Ms. Jane Doe will be transferred from Engineer, PT ITM at Bontang to Senior Engineer, PT ITM at Jakarta."
    );
    expect(result.effectiveSentence).toBe(
      "This announcement will be effectively applied starting from July 1st, 2026."
    );
  });

  it("builds a temporary assignment sentence + assignment date sentence", () => {
    const result = buildNarration(
      "Assignment",
      [
        emp({
          employeeName: "Lucas Manurung",
          currentPosition: "Technical Specialist",
          newPosition: "Port",
          currentCompany: "PT Indominco Mandiri",
          currentLocation: "Bontang Site",
          newCompany: "PT Indominco Mandiri",
          newLocation: "Bontang Site",
          assignmentStartDate: d("2026-05-15"),
          assignmentEndDate: d("2027-05-14"),
        }),
      ],
      d("2026-06-25")
    );
    expect(result.blocked).toBe(false);
    expect(result.narrationText).toBe(
      "• Lucas Manurung has been assigned from Technical Specialist to Port, PT Indominco Mandiri at Bontang Site."
    );
    expect(result.effectiveSentence).toBe(
      "The assignment has been effective from May 15th, 2026 and will continue until May 14th, 2027."
    );
  });

  it("blocks when a temporary assignment is missing its end date", () => {
    const result = buildNarration(
      "Assignment",
      [
        emp({
          employeeName: "Jane Doe",
          currentPosition: "Analyst",
          newPosition: "Senior Analyst",
          currentCompany: "PT ITM",
          newCompany: "PT ITM",
          assignmentStartDate: d("2026-05-15"),
          assignmentEndDate: null,
        }),
      ],
      d("2026-06-25")
    );
    expect(result.blocked).toBe(true);
  });
});
