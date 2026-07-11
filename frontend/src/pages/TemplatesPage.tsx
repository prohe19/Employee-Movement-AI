import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { InfoNote, TextInput } from "../components/ui";
import { templatesApi } from "../api/endpoints";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { Template } from "../api/types";
import { formatUiDate } from "../lib/format";

export function TemplatesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  const load = () =>
    templatesApi
      .list()
      .then(({ templates }) => {
        setTemplates(templates);
        setSelected((prev) => prev ?? templates[0] ?? null);
      })
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    setError(null);
    try {
      await templatesApi.create({ name: form.name, code: form.code });
      setForm({ name: "", code: "" });
      setCreating(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create template");
    }
  };

  const tokens = selected?.placeholders?.tokens ?? [];

  return (
    <AppShell
      eyebrow="// TEMPLATE ENGINE"
      title="Template Management"
      actions={
        isAdmin ? (
          <button className="btn" onClick={() => setCreating((c) => !c)}>
            + NEW TEMPLATE
          </button>
        ) : undefined
      }
    >
      {error && <div className="alert alert-error" style={{ marginTop: 18 }}>{error}</div>}

      {creating && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
            <div>
              <div className="label">// NAME</div>
              <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="ITM Standard — Employee Movement" />
            </div>
            <div>
              <div className="label">// CODE</div>
              <TextInput value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="ITM-STANDARD-MOVEMENT" />
            </div>
            <button className="btn" onClick={create} disabled={!form.name || !form.code}>
              CREATE
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 22, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {templates.length === 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>No templates yet.</div>
          )}
          {templates.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelected(t)}
              style={{
                border: `1px solid ${selected?.id === t.id ? "rgba(255,42,109,0.5)" : "rgba(177,74,237,0.28)"}`,
                background: "rgba(177,74,237,0.03)",
                padding: "16px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
              }}
            >
              <div style={{ width: 42, height: 42, border: "1px solid rgba(255,42,109,0.35)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ff5a8c", flex: "0 0 auto" }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M4 1.5h5l3 3v10H4z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M9 1.5v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-mono)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13.5, color: "var(--text)" }}>{t.name}</span>
                  <span style={{ fontSize: 9.5, padding: "2px 7px", border: "1px solid rgba(177,74,237,0.3)", color: "rgba(255,150,190,0.6)" }}>v{t.version}</span>
                </div>
                <div style={{ fontSize: 10.5, color: "rgba(255,150,190,0.5)", marginTop: 5 }}>
                  {t.code} · {t.companyScope ?? "All companies"} · {t.movementTypeScope ?? "All movements"}
                </div>
                <div style={{ fontSize: 9.5, color: "rgba(255,150,190,0.35)", marginTop: 3 }}>Updated {formatUiDate(t.updatedAt)}</div>
              </div>
              <span className="pill" style={{ color: t.isActive ? "#34d399" : "#f87171" }}>
                <span className="dot" style={{ width: 7, height: 7, background: t.isActive ? "#34d399" : "#f87171", boxShadow: `0 0 6px ${t.isActive ? "#34d399" : "#f87171"}` }} />
                {t.isActive ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
          ))}
        </div>

        <div className="panel">
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Configured Placeholders</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.5)", marginTop: 6, lineHeight: 1.5 }}>
            Tokens the engine fills from extracted data. AI writes the content; the template controls layout.
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 16 }}>
            {tokens.length === 0 && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.4)" }}>No placeholders configured.</span>
            )}
            {tokens.map((token) => (
              <span key={token} style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, padding: "5px 9px", background: "rgba(255,42,109,0.08)", border: "1px solid rgba(255,42,109,0.25)", color: "#ff9dc0" }}>
                {`{{ ${token} }}`}
              </span>
            ))}
          </div>
          <InfoNote style={{ marginTop: 20 }}>
            The AI generates the wording; the template engine owns layout &amp; formatting (A4, margins, bullet style,
            signature block).
          </InfoNote>
        </div>
      </div>
    </AppShell>
  );
}
