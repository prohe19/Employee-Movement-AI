import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { TextInput } from "../components/ui";
import { transferFormsApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { COMPANIES, SITES } from "../lib/options";
import { toDateInputValue } from "../lib/format";
import type { TransferForm } from "../api/types";

const TITLES = ["Mr.", "Ms.", "Mrs."];

interface FormState {
  transferType: "" | "between_companies" | "within_company";
  docNumber: string;
  movementType: "Transfer" | "Assignment";
  title: string;
  employeeName: string;
  employeeId: string;
  levelJs: string;
  levelJp: string;
  positionFrom: string; positionTo: string;
  costCenterFrom: string; costCenterTo: string;
  sectionFrom: string; sectionTo: string;
  departmentFrom: string; departmentTo: string;
  divisionFrom: string; divisionTo: string;
  locationFrom: string; locationTo: string;
  companyFrom: string; companyTo: string;
  effectiveDate: string;
  vMpp: boolean; vOrgStructureJe: boolean; vCompetencyGap: boolean; vJpGap: boolean;
  vYearInPosition: boolean; vTransferReason: boolean; vOthers: boolean;
}

const blank: FormState = {
  transferType: "", docNumber: "", movementType: "Transfer", title: "Mr.",
  employeeName: "", employeeId: "", levelJs: "", levelJp: "",
  positionFrom: "", positionTo: "", costCenterFrom: "", costCenterTo: "",
  sectionFrom: "", sectionTo: "", departmentFrom: "", departmentTo: "",
  divisionFrom: "", divisionTo: "", locationFrom: "", locationTo: "",
  companyFrom: "", companyTo: "", effectiveDate: "",
  vMpp: false, vOrgStructureJe: false, vCompetencyGap: false, vJpGap: false,
  vYearInPosition: false, vTransferReason: false, vOthers: false,
};

function fromApi(f: TransferForm): FormState {
  const s = (v: string | null) => v ?? "";
  const n = (v: number | null) => (v == null ? "" : String(v));
  return {
    transferType: f.transferType ?? "", docNumber: s(f.docNumber), movementType: f.movementType,
    title: f.title ?? "Mr.", employeeName: f.employeeName, employeeId: s(f.employeeId),
    levelJs: n(f.levelJs), levelJp: n(f.levelJp),
    positionFrom: s(f.positionFrom), positionTo: s(f.positionTo),
    costCenterFrom: s(f.costCenterFrom), costCenterTo: s(f.costCenterTo),
    sectionFrom: s(f.sectionFrom), sectionTo: s(f.sectionTo),
    departmentFrom: s(f.departmentFrom), departmentTo: s(f.departmentTo),
    divisionFrom: s(f.divisionFrom), divisionTo: s(f.divisionTo),
    locationFrom: s(f.locationFrom), locationTo: s(f.locationTo),
    companyFrom: s(f.companyFrom), companyTo: s(f.companyTo),
    effectiveDate: toDateInputValue(f.effectiveDate),
    vMpp: f.vMpp, vOrgStructureJe: f.vOrgStructureJe, vCompetencyGap: f.vCompetencyGap, vJpGap: f.vJpGap,
    vYearInPosition: f.vYearInPosition, vTransferReason: f.vTransferReason, vOthers: f.vOthers,
  };
}

const VERIFY: { key: keyof FormState; label: string }[] = [
  { key: "vMpp", label: "Shall refer to the Approved Manpower Planning (MPP)" },
  { key: "vOrgStructureJe", label: "Shall refer Organization Structure and supported by Job Evaluation (JE)" },
  { key: "vCompetencyGap", label: "No gap in the Primary Competency in the intended (future) position" },
  { key: "vJpGap", label: "Gap between JP the designated position maximum 1 level higher than JS and not a promotional transfer" },
  { key: "vYearInPosition", label: "The year in position should be minimum 1 year" },
  { key: "vTransferReason", label: "The transfer conducted due to manpower need, operational expansion or change in strategy/vision/mission" },
  { key: "vOthers", label: "Others" },
];

const label = (t: string) => <div className="label">{t}</div>;

export function TransferFormEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [state, setState] = useState<FormState>(blank);
  const [formId, setFormId] = useState<string | null>(isNew ? null : id!);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    transferFormsApi
      .get(id!)
      .then((r) => setState(fromApi(r.form)))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (patch: Partial<FormState>) => setState((s) => ({ ...s, ...patch }));

  const payload = () => {
    const str = (v: string) => (v.trim() === "" ? null : v.trim());
    const num = (v: string) => (v.trim() === "" ? null : Number(v));
    return {
      transferType: state.transferType || null,
      docNumber: str(state.docNumber),
      movementType: state.movementType,
      title: str(state.title),
      employeeName: state.employeeName.trim(),
      employeeId: str(state.employeeId),
      levelJs: num(state.levelJs),
      levelJp: num(state.levelJp),
      positionFrom: str(state.positionFrom), positionTo: str(state.positionTo),
      costCenterFrom: str(state.costCenterFrom), costCenterTo: str(state.costCenterTo),
      sectionFrom: str(state.sectionFrom), sectionTo: str(state.sectionTo),
      departmentFrom: str(state.departmentFrom), departmentTo: str(state.departmentTo),
      divisionFrom: str(state.divisionFrom), divisionTo: str(state.divisionTo),
      locationFrom: str(state.locationFrom), locationTo: str(state.locationTo),
      companyFrom: str(state.companyFrom), companyTo: str(state.companyTo),
      effectiveDate: state.effectiveDate ? new Date(state.effectiveDate).toISOString() : null,
      vMpp: state.vMpp, vOrgStructureJe: state.vOrgStructureJe, vCompetencyGap: state.vCompetencyGap,
      vJpGap: state.vJpGap, vYearInPosition: state.vYearInPosition, vTransferReason: state.vTransferReason,
      vOthers: state.vOthers,
    };
  };

  const save = async (): Promise<string | null> => {
    setSaving(true);
    setError(null);
    try {
      if (formId) {
        await transferFormsApi.update(formId, payload());
        return formId;
      }
      const { form } = await transferFormsApi.create(payload());
      setFormId(form.id);
      return form.id;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save the form");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveAndPdf = async () => {
    const savedId = await save();
    if (!savedId) return;
    try {
      const { form } = await transferFormsApi.generatePdf(savedId);
      if (form.pdfUrl) window.open(form.pdfUrl, "_blank");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "PDF generation failed");
    }
  };

  const canSave = state.employeeName.trim().length > 0;

  // from/to text row
  const ftText = (lbl: string, keyFrom: keyof FormState, keyTo: keyof FormState) => (
    <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", gap: 10, alignItems: "center", marginBottom: 8 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.6)" }}>{lbl}</span>
      <TextInput placeholder="from" value={state[keyFrom] as string} onChange={(e) => set({ [keyFrom]: e.target.value } as Partial<FormState>)} />
      <TextInput placeholder="to" value={state[keyTo] as string} onChange={(e) => set({ [keyTo]: e.target.value } as Partial<FormState>)} />
    </div>
  );

  const ftSelect = (lbl: string, keyFrom: keyof FormState, keyTo: keyof FormState, opts: readonly string[]) => {
    const sel = (k: keyof FormState) => (
      <select className="select" value={state[k] as string} onChange={(e) => set({ [k]: e.target.value } as Partial<FormState>)} style={{ appearance: "none", cursor: "pointer" }}>
        <option value="" style={{ background: "#170722" }}>Select…</option>
        {opts.map((o) => <option key={o} value={o} style={{ background: "#170722" }}>{o}</option>)}
      </select>
    );
    return (
      <div style={{ display: "grid", gridTemplateColumns: "150px 1fr 1fr", gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.6)" }}>{lbl}</span>
        {sel(keyFrom)}
        {sel(keyTo)}
      </div>
    );
  };

  if (loading) {
    return <AppShell eyebrow="// TRANSFER FORM" title="Loading…"><div /></AppShell>;
  }

  return (
    <AppShell eyebrow="// TRANSFER FORM" title={isNew ? "New Transfer Form" : "Edit Transfer Form"}>
      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      <div className="panel" style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div>
            {label("// MOVEMENT TYPE")}
            <select className="select" value={state.movementType} onChange={(e) => set({ movementType: e.target.value as FormState["movementType"] })} style={{ appearance: "none", cursor: "pointer" }}>
              <option value="Transfer" style={{ background: "#170722" }}>Transfer</option>
              <option value="Assignment" style={{ background: "#170722" }}>Assignment</option>
            </select>
          </div>
          <div>
            {label("// TRANSFER TYPE (CHECKBOX ON FORM)")}
            <select className="select" value={state.transferType} onChange={(e) => set({ transferType: e.target.value as FormState["transferType"] })} style={{ appearance: "none", cursor: "pointer" }}>
              <option value="" style={{ background: "#170722" }}>— none —</option>
              <option value="between_companies" style={{ background: "#170722" }}>Between Companies &amp; Dept Head Level and Up</option>
              <option value="within_company" style={{ background: "#170722" }}>Within Company &amp; Superintendent and below</option>
            </select>
          </div>
          <div>
            {label("// DOC NUMBER")}
            <TextInput value={state.docNumber} onChange={(e) => set({ docNumber: e.target.value })} placeholder="Optional" />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Employee Information</div>
        <div style={{ display: "grid", gridTemplateColumns: "90px 1.4fr 1fr", gap: 12, marginBottom: 8 }}>
          <div>{label("TITLE")}<select className="select" value={state.title} onChange={(e) => set({ title: e.target.value })} style={{ appearance: "none", cursor: "pointer" }}>{TITLES.map((t) => <option key={t} value={t} style={{ background: "#170722" }}>{t}</option>)}</select></div>
          <div>{label("NAME *")}<TextInput value={state.employeeName} onChange={(e) => set({ employeeName: e.target.value })} /></div>
          <div>{label("EMPLOYEE ID")}<TextInput value={state.employeeId} onChange={(e) => set({ employeeId: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>{label("LEVEL JS")}<TextInput type="number" value={state.levelJs} onChange={(e) => set({ levelJs: e.target.value })} /></div>
          <div>{label("LEVEL JP")}<TextInput type="number" value={state.levelJp} onChange={(e) => set({ levelJp: e.target.value })} /></div>
          <div>{label("EFFECTIVE DATE")}<TextInput type="date" value={state.effectiveDate} onChange={(e) => set({ effectiveDate: e.target.value })} /></div>
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(177,74,237,0.9)", marginBottom: 10, fontWeight: 700 }}>// FROM → TO</div>
        {ftText("Position", "positionFrom", "positionTo")}
        {ftText("Cost Center", "costCenterFrom", "costCenterTo")}
        {ftText("Section", "sectionFrom", "sectionTo")}
        {ftText("Department", "departmentFrom", "departmentTo")}
        {ftText("Division", "divisionFrom", "divisionTo")}
        {ftSelect("Location", "locationFrom", "locationTo", SITES)}
        {ftSelect("Company", "companyFrom", "companyTo", COMPANIES)}
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Verification (Check by HR)</div>
        {VERIFY.map((v) => (
          <label key={v.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 9, cursor: "pointer", fontSize: 12.5, color: "var(--text)" }}>
            <input type="checkbox" checked={state[v.key] as boolean} onChange={(e) => set({ [v.key]: e.target.checked } as Partial<FormState>)} style={{ marginTop: 2 }} />
            <span>{v.label}</span>
          </label>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <button className="btn-ghost" onClick={() => navigate("/transfer-forms")}>← BACK</button>
        <button className="btn-ghost" onClick={save} disabled={!canSave || saving}>{saving ? "SAVING…" : "SAVE"}</button>
        <button className="btn" onClick={saveAndPdf} disabled={!canSave || saving}>SAVE &amp; DOWNLOAD PDF</button>
      </div>
    </AppShell>
  );
}
