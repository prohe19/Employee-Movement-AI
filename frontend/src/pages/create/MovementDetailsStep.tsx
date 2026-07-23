import { useEffect, useState } from "react";
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES, toDateInputValue } from "../../lib/format";
import { COMPANIES, SITES } from "../../lib/options";
import { announcementsApi, transferFormsApi } from "../../api/endpoints";
import { ApiError } from "../../api/client";
import type { MovementType, TransferForm } from "../../api/types";
import { emptyEmployee, EditableEmployee, MAX_EMPLOYEES, TITLE_OPTIONS, WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  patch: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

type FieldKey = keyof EditableEmployee;

/** Which date fields matter for the chosen movement type. */
function dateFieldsFor(movementType: MovementType): { key: FieldKey; label: string }[] {
  if (movementType === "Assignment") {
    return [
      { key: "assignmentStartDate", label: "ASSIGNMENT START" },
      { key: "assignmentEndDate", label: "ASSIGNMENT END" },
    ];
  }
  return [{ key: "effectiveDate", label: "EFFECTIVE DATE" }];
}

type FieldDef = { key: FieldKey; label: string; type?: string; options?: readonly string[] };

const GROUPS: { title: string; fields: FieldDef[] }[] = [
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
    ],
  },
  {
    title: "COMPANY & LOCATION",
    fields: [
      { key: "currentCompany", label: "CURRENT COMPANY (PT) *", options: COMPANIES },
      { key: "newCompany", label: "NEW COMPANY (PT) *", options: COMPANIES },
      { key: "currentLocation", label: "CURRENT SITE / LOCATION *", options: SITES },
      { key: "newLocation", label: "NEW SITE / LOCATION *", options: SITES },
    ],
  },
];

export function MovementDetailsStep({ state, patch, onNext }: Props) {
  const [uploading, setUploading] = useState<Record<number, boolean>>({});
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [forms, setForms] = useState<TransferForm[]>([]);

  useEffect(() => {
    transferFormsApi
      .list()
      .then((r) => setForms(r.forms))
      .catch(() => undefined);
  }, []);

  const prefillFromForm = (index: number, formId: string) => {
    const f = forms.find((x) => x.id === formId);
    if (!f) return;
    const s = (v: string | null) => v ?? "";
    const fields: Partial<EditableEmployee> = {
      title: f.title ?? "Mr.",
      employeeName: f.employeeName,
      employeeId: s(f.employeeId),
      currentJs: f.levelJs != null ? String(f.levelJs) : "",
      currentPosition: s(f.positionFrom), newPosition: s(f.positionTo),
      currentDepartment: s(f.departmentFrom), newDepartment: s(f.departmentTo),
      currentDivision: s(f.divisionFrom), newDivision: s(f.divisionTo),
      currentLocation: s(f.locationFrom), newLocation: s(f.locationTo),
      currentCompany: s(f.companyFrom), newCompany: s(f.companyTo),
    };
    const eff = toDateInputValue(f.effectiveDate);
    if (f.movementType === "Assignment") fields.assignmentStartDate = eff;
    else fields.effectiveDate = eff;
    const employees = state.employees.map((emp, i) => (i === index ? { ...emp, ...fields } : emp));
    patch({ employees, movementType: f.movementType });
  };

  const setEmployee = (index: number, key: FieldKey, value: string) => {
    const employees = state.employees.map((emp, i) => (i === index ? { ...emp, [key]: value } : emp));
    patch({ employees });
  };

  const setEmployeeFields = (index: number, fields: Partial<EditableEmployee>) => {
    const employees = state.employees.map((emp, i) => (i === index ? { ...emp, ...fields } : emp));
    patch({ employees });
  };

  const handlePhoto = async (index: number, file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    setUploading((u) => ({ ...u, [index]: true }));
    try {
      const { url, key } = await announcementsApi.uploadPhoto(file);
      setEmployeeFields(index, { photoUrl: url, photoKey: key });
    } catch (e) {
      setPhotoError(e instanceof ApiError ? e.message : "Could not upload photo");
    } finally {
      setUploading((u) => ({ ...u, [index]: false }));
    }
  };

  const addEmployee = () => {
    if (state.employees.length >= MAX_EMPLOYEES) return;
    patch({ employees: [...state.employees, emptyEmployee()] });
  };
  const removeEmployee = (index: number) =>
    patch({ employees: state.employees.filter((_, i) => i !== index) });

  const dateFields = dateFieldsFor(state.movementType);
  const canContinue = state.employees.every(
    (e) =>
      e.employeeName.trim().length > 0 &&
      e.photoUrl.trim().length > 0 &&
      e.currentCompany.trim().length > 0 &&
      e.newCompany.trim().length > 0 &&
      e.currentLocation.trim().length > 0 &&
      e.newLocation.trim().length > 0
  );
  const atMax = state.employees.length >= MAX_EMPLOYEES;

  const labelStyle = { fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,150,190,0.5)", marginBottom: 6, display: "block" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ border: "1px solid rgba(177,74,237,0.28)", background: "rgba(177,74,237,0.03)", padding: "20px 22px" }}>
        {/* movement type */}
        <div style={{ marginBottom: 22 }}>
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
          <div key={index} style={{ marginBottom: 24, borderTop: index > 0 ? "1px solid rgba(177,74,237,0.2)" : undefined, paddingTop: index > 0 ? 20 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "rgba(177,74,237,0.9)" }}>
                // EMPLOYEE {index + 1}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {forms.length > 0 && (
                  <select
                    className="select"
                    value=""
                    onChange={(e) => {
                      if (e.target.value) prefillFromForm(index, e.target.value);
                      e.target.value = "";
                    }}
                    title="Prefill this employee from a saved transfer form"
                    style={{ appearance: "none", cursor: "pointer", height: 30, minHeight: 30, fontSize: 11, width: "auto", padding: "0 10px" }}
                  >
                    <option value="" style={{ background: "#170722" }}>⤵ Prefill from transfer form…</option>
                    {forms.map((f) => (
                      <option key={f.id} value={f.id} style={{ background: "#170722" }}>
                        {f.employeeName}{f.employeeId ? ` (${f.employeeId})` : ""}
                      </option>
                    ))}
                  </select>
                )}
                {state.employees.length > 1 && (
                  <span onClick={() => removeEmployee(index)} style={{ cursor: "pointer", color: "#f87171", fontSize: 11, fontFamily: "var(--font-mono)" }}>
                    REMOVE
                  </span>
                )}
              </div>
            </div>

            {/* identity row: photo + title + name + employee id + current JS */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(177,74,237,0.9)", marginBottom: 10 }}>
                // EMPLOYEE
              </div>

              {/* required photo for the announcement email image */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <div style={{ width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flex: "0 0 auto", border: "2px solid rgba(177,74,237,0.5)", background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {emp.photoUrl ? (
                    <img src={emp.photoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: 26, color: "rgba(255,150,190,0.4)" }}>👤</span>
                  )}
                </div>
                <div>
                  <label className="btn-ghost" style={{ cursor: "pointer", display: "inline-block", height: 34, lineHeight: "34px", padding: "0 14px" }}>
                    {uploading[index] ? "UPLOADING…" : emp.photoUrl ? "CHANGE PHOTO" : "UPLOAD PHOTO *"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      style={{ display: "none" }}
                      onChange={(e) => handlePhoto(index, e.target.files?.[0])}
                    />
                  </label>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,150,190,0.5)", marginTop: 6 }}>
                    Required · square headshot works best (JPEG/PNG/WebP)
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "90px 1.4fr 1fr", gap: 12 }}>
                <div>
                  <span style={labelStyle}>TITLE</span>
                  <select
                    className="select"
                    value={emp.title}
                    onChange={(e) => setEmployee(index, "title", e.target.value)}
                    style={{ appearance: "none", cursor: "pointer", minHeight: 40, fontSize: 12.5 }}
                  >
                    {TITLE_OPTIONS.map((t) => (
                      <option key={t} value={t} style={{ background: "#170722" }}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <span style={labelStyle}>NAME *</span>
                  <input
                    className="input"
                    value={emp.employeeName}
                    onChange={(e) => setEmployee(index, "employeeName", e.target.value)}
                    style={{ minHeight: 40, fontSize: 12.5 }}
                  />
                </div>
                <div>
                  <span style={labelStyle}>EMPLOYEE ID (OPTIONAL)</span>
                  <input
                    className="input"
                    value={emp.employeeId}
                    onChange={(e) => setEmployee(index, "employeeId", e.target.value)}
                    style={{ minHeight: 40, fontSize: 12.5 }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div>
                  <span style={labelStyle}>CURRENT JS (SETS SIGNATORY)</span>
                  <input
                    className="input"
                    type="number"
                    value={emp.currentJs}
                    onChange={(e) => setEmployee(index, "currentJs", e.target.value)}
                    style={{ minHeight: 40, fontSize: 12.5 }}
                  />
                </div>
              </div>
            </div>

            {GROUPS.map((group) => (
              <div key={group.title} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(177,74,237,0.9)", marginBottom: 10 }}>
                  // {group.title}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {group.fields.map((field) => (
                    <div key={field.key}>
                      <span style={labelStyle}>{field.label}</span>
                      {field.options ? (
                        <select
                          className="select"
                          value={emp[field.key]}
                          onChange={(e) => setEmployee(index, field.key, e.target.value)}
                          style={{ minHeight: 40, fontSize: 12.5, appearance: "none", cursor: "pointer" }}
                        >
                          <option value="" style={{ background: "#170722" }}>
                            Select…
                          </option>
                          {field.options.map((opt) => (
                            <option key={opt} value={opt} style={{ background: "#170722" }}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="input"
                          type={field.type ?? "text"}
                          value={emp[field.key]}
                          onChange={(e) => setEmployee(index, field.key, e.target.value)}
                          style={{ minHeight: 40, fontSize: 12.5 }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* dates depend on movement type */}
            <div style={{ marginBottom: 4 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(177,74,237,0.9)", marginBottom: 10 }}>
                // DATES
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {dateFields.map((field) => (
                  <div key={field.key}>
                    <span style={labelStyle}>{field.label}</span>
                    <input
                      className="input"
                      type="date"
                      value={emp[field.key]}
                      onChange={(e) => setEmployee(index, field.key, e.target.value)}
                      style={{ minHeight: 40, fontSize: 12.5 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {atMax ? (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.5)", textAlign: "center", padding: "10px 0" }}>
            Maximum of {MAX_EMPLOYEES} employees per announcement letter.
          </div>
        ) : (
          <button className="btn-ghost" onClick={addEmployee} style={{ width: "100%" }}>
            + ADD ANOTHER EMPLOYEE ({state.employees.length}/{MAX_EMPLOYEES})
          </button>
        )}
      </div>

      <div className="alert alert-warn" style={{ marginTop: 16 }}>
        ▲ Enter details exactly as they should appear in the letter. The narration sentence and signatory are generated
        from these fields — no AI, no extra cost. When the current company and site match the new ones, the letter states
        the company &amp; site once at the end automatically. Fields marked <strong>*</strong> (photo, company, and site) are required for every employee.
      </div>

      {photoError && <div className="alert alert-error" style={{ marginTop: 12 }}>{photoError}</div>}

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
        <button className="btn" onClick={onNext} disabled={!canContinue} style={{ minWidth: 240 }}>
          CONTINUE TO ANNOUNCEMENT →
        </button>
      </div>
    </div>
  );
}
