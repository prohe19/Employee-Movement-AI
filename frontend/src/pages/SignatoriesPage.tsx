import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { TextInput } from "../components/ui";
import { signatoriesApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Signatory } from "../api/types";

function jsRangeLabel(s: Signatory): string {
  if (s.jsMin == null && s.jsMax != null) return `JS ≤ ${s.jsMax}`;
  if (s.jsMin != null && s.jsMax == null) return `JS ≥ ${s.jsMin}`;
  if (s.jsMin != null && s.jsMax != null) return `JS ${s.jsMin}–${s.jsMax}`;
  return "Any JS";
}

export function SignatoriesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", jsMin: "", jsMax: "" });

  const load = () =>
    signatoriesApi
      .list()
      .then(({ signatories }) => setSignatories(signatories))
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setError(null);
    try {
      await signatoriesApi.create({
        name: form.name,
        title: form.title,
        jsMin: form.jsMin === "" ? null : Number(form.jsMin),
        jsMax: form.jsMax === "" ? null : Number(form.jsMax),
      });
      setForm({ name: "", title: "", jsMin: "", jsMax: "" });
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not add signatory");
    }
  };

  return (
    <AppShell
      eyebrow="// APPROVAL AUTHORITY"
      title="Signatory Settings"
      actions={isAdmin ? <button className="btn" onClick={() => setCreating((c) => !c)}>+ ADD SIGNATORY</button> : undefined}
    >
      {error && <div className="alert alert-error" style={{ marginTop: 18 }}>{error}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 20, padding: "14px 18px", border: "1px solid rgba(177,74,237,0.3)", background: "rgba(177,74,237,0.06)", fontFamily: "var(--font-mono)" }}>
        <span style={{ color: "#c98bff", fontSize: 14 }}>ⓘ</span>
        <span style={{ fontSize: 12, color: "rgba(255,150,190,0.75)", lineHeight: 1.5 }}>
          Signatory is auto-selected from the employee's <strong style={{ color: "var(--text)" }}>current JS</strong> — never the
          new/designated JS. For multi-employee announcements, the <strong style={{ color: "var(--text)" }}>highest current JS</strong> is used.
        </span>
      </div>

      {creating && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.7fr 0.7fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <div className="label">// NAME</div>
              <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <div className="label">// TITLE</div>
              <TextInput value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <div className="label">// JS MIN</div>
              <TextInput type="number" value={form.jsMin} onChange={(e) => setForm((f) => ({ ...f, jsMin: e.target.value }))} placeholder="—" />
            </div>
            <div>
              <div className="label">// JS MAX</div>
              <TextInput type="number" value={form.jsMax} onChange={(e) => setForm((f) => ({ ...f, jsMax: e.target.value }))} placeholder="—" />
            </div>
            <button className="btn" onClick={create} disabled={!form.name || !form.title}>
              ADD
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {signatories.map((s) => {
          const initials = s.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={s.id} className="panel" style={{ padding: "22px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, border: "1.5px solid #ff2a6d", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700, color: "var(--text)", flex: "0 0 auto", boxShadow: "0 0 14px rgba(255,42,109,0.4)" }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 17, color: "var(--text)" }}>{s.name}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "rgba(255,150,190,0.6)", marginTop: 2 }}>{s.title}</div>
                </div>
                <span className="pill" style={{ color: s.isActive ? "#34d399" : "#f87171" }}>
                  <span className="dot" style={{ width: 7, height: 7, background: s.isActive ? "#34d399" : "#f87171", boxShadow: `0 0 6px ${s.isActive ? "#34d399" : "#f87171"}` }} />
                  {s.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 20, fontFamily: "var(--font-mono)" }}>
                <div style={{ padding: "12px 14px", background: "rgba(255,42,109,0.06)", border: "1px solid rgba(255,42,109,0.25)" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(177,74,237,0.9)" }}>// RULE</div>
                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6 }}>Current {jsRangeLabel(s)}</div>
                </div>
                <div style={{ padding: "12px 14px", background: "rgba(177,74,237,0.06)", border: "1px solid rgba(177,74,237,0.25)" }}>
                  <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(177,74,237,0.9)" }}>// JS RANGE</div>
                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 6 }}>{jsRangeLabel(s)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
