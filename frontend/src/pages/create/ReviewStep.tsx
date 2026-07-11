import { ConfidenceDot } from "../../components/ui";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES } from "../../lib/format";
import type { MovementType } from "../../api/types";
import { emptyEmployee, EditableEmployee, WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  patch: (updates: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
}

type FieldKey = keyof Omit<EditableEmployee, "confidence">;

const GROUPS: { title: string; fields: { key: FieldKey; label: string; type?: string }[] }[] = [
  {
    title: "EMPLOYEE",
    fields: [
      { key: "employeeName", label: "NAME" },
      { key: "employeeId", label: "EMPLOYEE ID" },
      { key: "currentJs", label: "CURRENT JS", type: "number" },
      { key: "newJs", label: "NEW JS", type: "number" },
    ],
  },
  {
    title: "POSITION",
    fields: [
      { key: "currentPosition", label: "CURRENT POSITION" },
      { key: "newPosition", label: "NEW / ASSIGNED POSITION" },
    ],
  },
  {
    title: "ORGANIZATION",
    fields: [
      { key: "currentDepartment", label: "CURRENT DEPARTMENT" },
      { key: "newDepartment", label: "NEW DEPARTMENT" },
      { key: "currentDivision", label: "CURRENT DIVISION" },
      { key: "newDivision", label: "NEW DIVISION" },
      { key: "currentCostCenter", label: "CURRENT COST CENTER" },
      { key: "newCostCenter", label: "NEW COST CENTER" },
    ],
  },
  {
    title: "COMPANY & LOCATION",
    fields: [
      { key: "currentCompany", label: "CURRENT COMPANY" },
      { key: "newCompany", label: "NEW COMPANY" },
      { key: "currentLocation", label: "CURRENT LOCATION" },
      { key: "newLocation", label: "NEW LOCATION" },
    ],
  },
  {
    title: "DATES",
    fields: [
      { key: "effectiveDate", label: "EFFECTIVE DATE", type: "date" },
      { key: "assignmentStartDate", label: "ASSIGNMENT START", type: "date" },
      { key: "assignmentEndDate", label: "ASSIGNMENT END", type: "date" },
    ],
  },
];

export function ReviewStep({ state, patch, onBack, onNext }: Props) {
  const setEmployee = (index: number, key: FieldKey, value: string) => {
    const employees = state.employees.map((emp, i) => (i === index ? { ...emp, [key]: value } : emp));
    patch({ employees });
  };

  const addEmployee = () => patch({ employees: [...state.employees, emptyEmployee()] });
  const removeEmployee = (index: number) =>
    patch({ employees: state.employees.filter((_, i) => i !== index) });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 16, alignItems: "start" }}>
      <div style={{ border: "1px solid rgba(177,74,237,0.28)", background: "rgba(177,74,237,0.03)", padding: "20px 22px", maxHeight: 640, overflow: "auto" }}>
        {/* movement type */}
        <div style={{ marginBottom: 20 }}>
          <div className="label" style={{ color: "rgba(177,74,237,0.9)" }}>// MOVEMENT TYPE</div>
          <select
            className="select"
            value={state.movementType}
            onChange={(e) => patch({ movementType: e.target.value as MovementType })}
            style={{ appearance: "none", cursor: "pointer" }}
          >
            {MOVEMENT_TYPES.map((mt) => (
              <option key={mt} value={mt} style={{ background: "#170722" }}>
                {MOVEMENT_TYPE_LABELS[mt]}
              </option>
            ))}
          </select>
        </div>

        {state.employees.map((emp, index) => (
          <div key={index} style={{ marginBottom: 22, borderTop: index > 0 ? "1px solid rgba(177,74,237,0.2)" : undefined, paddingTop: index > 0 ? 18 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "rgba(177,74,237,0.9)" }}>
                // EMPLOYEE {index + 1}
              </span>
              {state.employees.length > 1 && (
                <span onClick={() => removeEmployee(index)} style={{ cursor: "pointer", color: "#f87171", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  REMOVE
                </span>
              )}
            </div>
            {GROUPS.map((group) => (
              <div key={group.title} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(177,74,237,0.9)", marginBottom: 10 }}>
                  // {group.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {group.fields.map((field) => (
                    <div key={field.key}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,150,190,0.5)" }}>{field.label}</span>
                        <ConfidenceDot confidence={emp.confidence[field.key] ?? "missing"} />
                      </div>
                      <input
                        className="input"
                        type={field.type ?? "text"}
                        value={emp[field.key]}
                        onChange={(e) => setEmployee(index, field.key, e.target.value)}
                        style={{ minHeight: 40, fontSize: 12.5 }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <button className="btn-ghost" onClick={addEmployee} style={{ width: "100%" }}>
          + ADD ANOTHER EMPLOYEE
        </button>
      </div>

      {/* original form preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid rgba(177,74,237,0.28)", background: "rgba(177,74,237,0.03)", fontFamily: "var(--font-mono)" }}>
          <span style={{ fontSize: 11.5, color: "var(--text)", fontWeight: 700 }}>
            ORIGINAL FORM{" "}
            <span style={{ color: "rgba(255,150,190,0.45)", fontWeight: 400 }}>· {state.fileName ?? ""}</span>
          </span>
        </div>
        <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(177,74,237,0.2)", padding: 16, maxHeight: 560, overflow: "auto" }}>
          {state.fileUrl ? (
            <FormPreview url={state.fileUrl} name={state.fileName ?? "form"} />
          ) : (
            <div style={{ color: "rgba(255,150,190,0.5)", fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center", padding: 40 }}>
              No preview available
            </div>
          )}
        </div>
        <div className="alert alert-warn">
          ▲ Extracted from the movement information section. Signatures, approval matrices &amp; handwritten notes are
          ignored. Fields flagged amber/red are <strong>never auto-filled</strong> — confirm them before continuing.
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>
            ← BACK
          </button>
          <button className="btn" onClick={onNext} style={{ flex: 2 }} disabled={!state.employees[0]?.employeeName.trim()}>
            CONTINUE TO DETAILS →
          </button>
        </div>
      </div>
    </div>
  );
}

function FormPreview({ url, name }: { url: string; name: string }) {
  const isPdf = url.toLowerCase().includes(".pdf");
  if (isPdf) {
    return <iframe src={url} title={name} style={{ width: "100%", height: 520, border: "none", background: "#fff" }} />;
  }
  return <img src={url} alt={name} style={{ width: "100%", display: "block", boxShadow: "0 12px 30px -10px rgba(0,0,0,0.6)" }} />;
}
