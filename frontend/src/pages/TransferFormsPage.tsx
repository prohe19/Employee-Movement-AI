import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { transferFormsApi } from "../api/endpoints";
import type { TransferForm } from "../api/types";
import { formatUiDate, MOVEMENT_TYPE_LABELS } from "../lib/format";

export function TransferFormsPage() {
  const [forms, setForms] = useState<TransferForm[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    transferFormsApi
      .list(search)
      .then((r) => setForms(r.forms))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const generate = async (f: TransferForm) => {
    setBusyId(f.id);
    setError(null);
    try {
      const { form } = await transferFormsApi.generatePdf(f.id);
      setForms((list) => list.map((x) => (x.id === form.id ? form : x)));
      if (form.pdfUrl) window.open(form.pdfUrl, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate PDF");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (f: TransferForm) => {
    if (!window.confirm(`Delete the transfer form for ${f.employeeName}? This cannot be undone.`)) return;
    setBusyId(f.id);
    try {
      await transferFormsApi.remove(f.id);
      setForms((list) => list.filter((x) => x.id !== f.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell
      eyebrow="// TRANSFER FORMS"
      title="Employee Transfer Forms"
      actions={
        <Link to="/transfer-forms/new" className="btn" style={{ textDecoration: "none" }}>
          + NEW FORM
        </Link>
      }
    >
      <input
        className="input"
        style={{ maxWidth: 340, minHeight: 40, marginTop: 20 }}
        placeholder="Search name, ID, doc number…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}

      <div style={{ marginTop: 16, border: "1px solid rgba(177,74,237,0.22)", overflow: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1.2fr",
            minWidth: 900,
            padding: "12px 16px",
            background: "rgba(177,74,237,0.08)",
            borderBottom: "1px solid rgba(255,42,109,0.28)",
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "rgba(177,74,237,0.9)",
          }}
        >
          <span>EMPLOYEE</span>
          <span>MOVEMENT</span>
          <span>DOC NUMBER</span>
          <span>EFFECTIVE</span>
          <span>CREATED</span>
          <span style={{ textAlign: "right" }}>ACTIONS</span>
        </div>
        {loading && <div style={{ padding: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>Loading…</div>}
        {!loading && forms.length === 0 && (
          <div style={{ padding: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>
            No transfer forms yet. Create one to get started.
          </div>
        )}
        {forms.map((f) => (
          <div
            key={f.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr 1.2fr",
              minWidth: 900,
              alignItems: "center",
              padding: "13px 16px",
              borderBottom: "1px solid rgba(177,74,237,0.1)",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
            }}
          >
            <span style={{ color: "var(--text)" }}>
              {f.employeeName}
              <br />
              <span style={{ fontSize: 9.5, color: "rgba(255,150,190,0.4)" }}>{f.employeeId ?? ""}</span>
            </span>
            <span style={{ color: "rgba(255,150,190,0.6)" }}>{MOVEMENT_TYPE_LABELS[f.movementType]}</span>
            <span style={{ color: "rgba(255,150,190,0.6)" }}>{f.docNumber ?? "—"}</span>
            <span style={{ color: "rgba(255,150,190,0.6)", fontSize: 10.5 }}>{formatUiDate(f.effectiveDate)}</span>
            <span style={{ color: "rgba(255,150,190,0.6)", fontSize: 10.5 }}>{formatUiDate(f.createdAt)}</span>
            <span style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <Link to={`/transfer-forms/${f.id}`} className="btn-ghost" style={{ height: 28, padding: "0 9px", fontSize: 10, textDecoration: "none", lineHeight: "28px" }}>
                EDIT
              </Link>
              <button className="btn-ghost" style={{ height: 28, padding: "0 9px", fontSize: 10 }} disabled={busyId === f.id} onClick={() => generate(f)}>
                {busyId === f.id ? "…" : f.pdfUrl ? "PDF ↻" : "PDF"}
              </button>
              <button
                onClick={() => remove(f)}
                disabled={busyId === f.id}
                style={{ background: "transparent", border: "1px solid rgba(248,113,113,0.4)", color: "#f87171", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, padding: "5px 9px", cursor: "pointer" }}
              >
                DEL
              </button>
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
