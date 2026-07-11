import Anthropic from "@anthropic-ai/sdk";
import { env } from "../config/env";
import {
  EXTRACTION_TOOL_JSON_SCHEMA,
  ExtractionResult,
  extractionResultSchema,
} from "../types/extraction";

const SYSTEM_PROMPT = `You are extracting structured data from a scanned/PDF ITM employee movement form (e.g. ITM-F-HR-002 "Employee Assignment") for an official HR announcement.

Rules:
- Prioritize sections titled "Assignment Information", "Transfer Information", "Employee Movement Information", or "Movement Details".
- Only extract fields relevant to the announcement (employee identity, position/department/division/cost center/company/location changes, JS grade, effective/assignment dates, and the movement type).
- Ignore approval matrices, signatures, handwritten notes, org charts, key deliverables, development plans, unrelated remarks, and appendices.
- Never guess or infer a value that is not clearly legible/stated on the form. If a value is unclear, blank, or ambiguous, set "value" to null and "confidence" to "missing". If a value is present but partially illegible or you are not fully certain, set "confidence" to "review".
- Only mark "confidence": "high" when the value is clearly and unambiguously printed/written on the form.
- currentJs / newJs are the employee's Job Sequence (JS) grade — integers. Do not confuse with employee ID.
- If the form lists multiple employees, return one entry per employee in "employees".
- Call the extract_employee_movement tool exactly once with the complete result. Do not include any other commentary.`;

function buildDocumentBlock(buffer: Buffer, mimeType: string) {
  const base64 = buffer.toString("base64");
  if (mimeType === "application/pdf") {
    return {
      type: "document" as const,
      source: { type: "base64" as const, media_type: "application/pdf" as const, data: base64 },
    };
  }
  return {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: mimeType as "image/png" | "image/jpeg" | "image/webp",
      data: base64,
    },
  };
}

async function extractWithClaude(buffer: Buffer, mimeType: string): Promise<ExtractionResult> {
  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  const response = await client.messages.create({
    model: env.anthropicModel,
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    tools: [
      {
        name: "extract_employee_movement",
        description: "Report the structured fields extracted from the employee movement form.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input_schema: EXTRACTION_TOOL_JSON_SCHEMA as any,
      },
    ],
    tool_choice: { type: "tool", name: "extract_employee_movement" },
    messages: [
      {
        role: "user",
        content: [
          buildDocumentBlock(buffer, mimeType),
          {
            type: "text",
            text: "Extract the employee movement announcement fields from this form.",
          },
        ] as unknown as Anthropic.MessageParam["content"],
      },
    ],
  });

  const toolUse = response.content.find(
    (block) => block.type === "tool_use"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
  if (!toolUse) {
    throw new Error("AI extraction did not return a structured result");
  }
  return extractionResultSchema.parse(toolUse.input);
}

/** Deterministic fallback used when ANTHROPIC_API_KEY is not configured (local/dev/demo). */
function mockExtraction(): ExtractionResult {
  return {
    movementType: { value: "TemporaryAssignment", confidence: "high" },
    employees: [
      {
        employeeName: { value: "Lucas Manurung", confidence: "high" },
        employeeId: { value: "0610874", confidence: "high" },
        currentPosition: { value: "Technical Specialist", confidence: "high" },
        newPosition: { value: "Port", confidence: "review" },
        currentJs: { value: 17, confidence: "high" },
        newJs: { value: 17, confidence: "high" },
        currentDepartment: { value: null, confidence: "missing" },
        newDepartment: { value: null, confidence: "missing" },
        currentDivision: { value: null, confidence: "missing" },
        newDivision: { value: null, confidence: "missing" },
        currentCostCenter: { value: null, confidence: "missing" },
        newCostCenter: { value: null, confidence: "missing" },
        currentCompany: { value: "PT Indominco Mandiri", confidence: "high" },
        newCompany: { value: "PT Indominco Mandiri", confidence: "high" },
        currentLocation: { value: "Bontang Site", confidence: "high" },
        newLocation: { value: "Bontang Site", confidence: "high" },
        effectiveDate: { value: "2026-05-15", confidence: "high" },
        assignmentStartDate: { value: "2026-05-15", confidence: "high" },
        assignmentEndDate: { value: "2027-05-14", confidence: "high" },
      },
    ],
    sourceSection: "ASSIGNMENT INFORMATION",
    overallConfidence: 0.86,
  };
}

export function computeOverallConfidence(result: ExtractionResult): number {
  const values: Array<"high" | "review" | "missing"> = [result.movementType.confidence];
  for (const emp of result.employees) {
    for (const key of Object.keys(emp) as (keyof typeof emp)[]) {
      values.push(emp[key].confidence);
    }
  }
  const weight = { high: 1, review: 0.5, missing: 0 } as const;
  const total = values.reduce((sum, c) => sum + weight[c], 0);
  return values.length ? Number((total / values.length).toFixed(2)) : 0;
}

export async function extractMovementForm(
  buffer: Buffer,
  mimeType: string
): Promise<ExtractionResult> {
  const result = env.anthropicApiKey
    ? await extractWithClaude(buffer, mimeType)
    : mockExtraction();
  return { ...result, overallConfidence: computeOverallConfidence(result) };
}
