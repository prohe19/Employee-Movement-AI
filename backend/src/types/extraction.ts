import { z } from "zod";

export const confidenceEnum = z.enum(["high", "review", "missing"]);
export type Confidence = z.infer<typeof confidenceEnum>;

function field<T extends z.ZodTypeAny>(valueSchema: T) {
  return z.object({
    value: valueSchema.nullable(),
    confidence: confidenceEnum,
  });
}

const stringField = field(z.string());
const intField = field(z.number().int());
const dateField = field(z.string()); // ISO yyyy-mm-dd, validated loosely — the model may mark missing

export const extractedEmployeeSchema = z.object({
  employeeName: stringField,
  employeeId: stringField,
  currentPosition: stringField,
  newPosition: stringField,
  currentJs: intField,
  newJs: intField,
  currentDepartment: stringField,
  newDepartment: stringField,
  currentDivision: stringField,
  newDivision: stringField,
  currentCostCenter: stringField,
  newCostCenter: stringField,
  currentCompany: stringField,
  newCompany: stringField,
  currentLocation: stringField,
  newLocation: stringField,
  effectiveDate: dateField,
  assignmentStartDate: dateField,
  assignmentEndDate: dateField,
});
export type ExtractedEmployee = z.infer<typeof extractedEmployeeSchema>;

export const movementTypeValueEnum = z.enum([
  "Transfer",
  "TemporaryAssignment",
  "PermanentAssignment",
  "Rotation",
  "LateralMovement",
  "ChangeOfPosition",
  "ChangeOfLocation",
  "ChangeOfCompany",
  "ActingAssignment",
  "EndOfAssignment",
  "Other",
]);

export const extractionResultSchema = z.object({
  movementType: field(movementTypeValueEnum),
  employees: z.array(extractedEmployeeSchema).min(1),
  sourceSection: z.string().nullable().optional(),
  overallConfidence: z.number().min(0).max(1),
});
export type ExtractionResult = z.infer<typeof extractionResultSchema>;

/** JSON Schema handed to the model as a forced tool call — keep in sync with extractionResultSchema. */
export const EXTRACTION_TOOL_JSON_SCHEMA = {
  type: "object",
  properties: {
    movementType: fieldJsonSchema({
      type: "string",
      enum: movementTypeValueEnum.options,
    }),
    employees: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          employeeName: fieldJsonSchema({ type: "string" }),
          employeeId: fieldJsonSchema({ type: "string" }),
          currentPosition: fieldJsonSchema({ type: "string" }),
          newPosition: fieldJsonSchema({ type: "string" }),
          currentJs: fieldJsonSchema({ type: "integer" }),
          newJs: fieldJsonSchema({ type: "integer" }),
          currentDepartment: fieldJsonSchema({ type: "string" }),
          newDepartment: fieldJsonSchema({ type: "string" }),
          currentDivision: fieldJsonSchema({ type: "string" }),
          newDivision: fieldJsonSchema({ type: "string" }),
          currentCostCenter: fieldJsonSchema({ type: "string" }),
          newCostCenter: fieldJsonSchema({ type: "string" }),
          currentCompany: fieldJsonSchema({ type: "string" }),
          newCompany: fieldJsonSchema({ type: "string" }),
          currentLocation: fieldJsonSchema({ type: "string" }),
          newLocation: fieldJsonSchema({ type: "string" }),
          effectiveDate: fieldJsonSchema({
            type: "string",
            description: "ISO 8601 date yyyy-mm-dd",
          }),
          assignmentStartDate: fieldJsonSchema({
            type: "string",
            description: "ISO 8601 date yyyy-mm-dd, only for temporary/acting assignments",
          }),
          assignmentEndDate: fieldJsonSchema({
            type: "string",
            description: "ISO 8601 date yyyy-mm-dd, only for temporary/acting assignments",
          }),
        },
        required: [
          "employeeName",
          "employeeId",
          "currentPosition",
          "newPosition",
          "currentJs",
          "newJs",
          "currentDepartment",
          "newDepartment",
          "currentDivision",
          "newDivision",
          "currentCostCenter",
          "newCostCenter",
          "currentCompany",
          "newCompany",
          "currentLocation",
          "newLocation",
          "effectiveDate",
          "assignmentStartDate",
          "assignmentEndDate",
        ],
      },
    },
    sourceSection: { type: ["string", "null"] },
    overallConfidence: { type: "number", minimum: 0, maximum: 1 },
  },
  required: ["movementType", "employees", "overallConfidence"],
} as const;

function fieldJsonSchema(valueSchema: Record<string, unknown>) {
  return {
    type: "object",
    properties: {
      value: { anyOf: [valueSchema, { type: "null" }] },
      confidence: { type: "string", enum: ["high", "review", "missing"] },
    },
    required: ["value", "confidence"],
  };
}
