import { useEffect, useState } from "react";
import { InfoNote, TextInput, TextArea } from "../../components/ui";
import { announcementsApi, formsApi, templatesApi } from "../../api/endpoints";
import { ApiError } from "../../api/client";
import type { SignatoryResolution, Template } from "../../api/types";
import { employeeToPayload, WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  patch: (updates: Partial<WizardState>) => void;
  onBack: () => void;
  onNext: () => void;
}

export function DetailsStep({ state, patch, onBack, onNext }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [signatory, setSignatory] = useState<SignatoryResolution | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load templates + persist the announcement so the backend can resolve the signatory.
  useEffect(() => {
    (async () => {
      try {
        const { templates } = await templatesApi.list();
        setTemplates(templates);
        if (!state.templateId && templates[0]) patch({ templateId: templates[0].id });
      } catch {
        /* templates are optional for display */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = async (): Promise<string | null> => {
    setError(null);
    setSaving(true);
    try {
      const payload = {
        number: state.announcementNumber.trim() || undefined,
        announcementDate: new Date(state.announcementDate).toISOString(),
        city: state.city,
        templateId: state.templateId || undefined,
        movementType: state.movementType,
        notes: state.notes || undefined,
        employees: state.employees.map(employeeToPayload),
      };

      let announcementId = state.announcementId;
      if (announcementId) {
        await announcementsApi.update(announcementId, payload);
      } else {
        const { announcement } = await announcementsApi.create(payload);
        announcementId = announcement.id;
        patch({ announcementId, announcementNumber: announcement.number });
        if (state.formId) await formsApi.link(state.formId, announcementId).catch(() => undefined);
      }

      const resolution = await announcementsApi.resolveSignatory(announcementId);
      setSignatory(resolution);
      return announcementId;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save announcement");
      return null;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    persist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = async () => {
    const id = await persist();
    if (id) onNext();
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: 16, alignItems: "start" }}>
      <div className="panel">
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)", marginBottom: 16 }}>
          Announcement Details
        </div>
        {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">// ANNOUNCEMENT NUMBER</div>
            <TextInput
              value={state.announcementNumber}
              onChange={(e) => patch({ announcementNumber: e.target.value })}
              placeholder="Auto-generated if blank"
            />
          </div>
          <div>
            <div className="label">// DATE</div>
            <TextInput type="date" value={state.announcementDate} onChange={(e) => patch({ announcementDate: e.target.value })} />
          </div>
          <div>
            <div className="label">// CITY</div>
            <TextInput value={state.city} onChange={(e) => patch({ city: e.target.value })} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">// TEMPLATE</div>
            <select
              className="select"
              value={state.templateId}
              onChange={(e) => patch({ templateId: e.target.value })}
              style={{ appearance: "none", cursor: "pointer" }}
            >
              <option value="" style={{ background: "#170722" }}>
                Select a template…
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id} style={{ background: "#170722" }}>
                  {t.name} (v{t.version})
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="label">// OPTIONAL NOTES</div>
            <TextArea value={state.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Add an internal note for this announcement…" />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 14, color: "var(--text)" }}>Signatory</div>
            <span
              className="pill"
              style={{ padding: "4px 10px", background: "rgba(255,42,109,0.14)", color: "#ff5a8c" }}
            >
              AUTO-SELECTED
            </span>
          </div>

          {saving && !signatory ? (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.6)" }}>Resolving signatory…</div>
          ) : signatory?.blocked ? (
            <div className="alert alert-warn">{signatory.reason}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <div className="label">// SIGNATORY</div>
                <div className="input" style={{ pointerEvents: "none" }}>{signatory?.signatoryName ?? "—"}</div>
              </div>
              <div>
                <div className="label">// TITLE</div>
                <div className="input" style={{ pointerEvents: "none" }}>{signatory?.signatoryTitle ?? "—"}</div>
              </div>
            </div>
          )}

          {signatory?.resolvedFromJs != null && !signatory.blocked && (
            <InfoNote style={{ marginTop: 13 }}>
              From <strong style={{ color: "#c98bff" }}>current JS {signatory.resolvedFromJs}</strong>. Signatory is
              chosen from the highest current JS, never the new/designated JS.
            </InfoNote>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-ghost" onClick={onBack} style={{ flex: 1 }}>
            ← BACK
          </button>
          <button className="btn" onClick={handleContinue} style={{ flex: 2 }} disabled={saving}>
            {saving ? "SAVING…" : "CONTINUE TO PREVIEW →"}
          </button>
        </div>
      </div>
    </div>
  );
}
