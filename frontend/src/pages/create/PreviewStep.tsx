import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PrismLogo } from "../../components/PrismLogo";
import { InfoNote } from "../../components/ui";
import { LetterPreview } from "../../components/LetterPreview";
import { announcementsApi } from "../../api/endpoints";
import { ApiError } from "../../api/client";
import type { Announcement, NarrationResult, ValidationReport } from "../../api/types";
import { WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  onBack: () => void;
}

export function PreviewStep({ state, onBack }: Props) {
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [narration, setNarration] = useState<NarrationResult | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!state.announcementId) return;
    setLoading(true);
    setError(null);
    try {
      const [narrationResult, validationReport, { announcement }] = await Promise.all([
        announcementsApi.narrate(state.announcementId),
        announcementsApi.validate(state.announcementId),
        announcementsApi.get(state.announcementId),
      ]);
      setNarration(narrationResult);
      setValidation(validationReport);
      setAnnouncement(announcement);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    if (!state.announcementId) return;
    setGenerating(true);
    setError(null);
    try {
      const { announcement } = await announcementsApi.generatePdf(state.announcementId);
      setAnnouncement(announcement);
      if (announcement.pdfUrl) window.open(announcement.pdfUrl, "_blank");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "PDF generation failed");
    } finally {
      setGenerating(false);
    }
  };

  const generateEmail = async () => {
    if (!state.announcementId) return;
    setGeneratingEmail(true);
    setError(null);
    try {
      const { announcement } = await announcementsApi.generateEmail(state.announcementId);
      setAnnouncement(announcement);
      if (announcement.emailImageUrl) window.open(announcement.emailImageUrl, "_blank");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Email image generation failed");
    } finally {
      setGeneratingEmail(false);
    }
  };

  const EMAIL_TYPES = [
    "Transfer",
    "Rotation",
    "LateralMovement",
    "ChangeOfPosition",
    "ChangeOfLocation",
    "ChangeOfCompany",
    "TemporaryAssignment",
    "PermanentAssignment",
    "ActingAssignment",
  ];
  const emailSupported = announcement ? EMAIL_TYPES.includes(announcement.movementType) : false;

  const failedRules = validation?.rules.filter((r) => !r.passed) ?? [];
  const ready = validation?.valid && !narration?.blocked;

  const narrationLines = (narration?.narrationText ?? "")
    .split("\n")
    .map((l) => l.replace(/^•\s*/, "").trim())
    .filter(Boolean);

  const companyName =
    state.employees[0]?.newCompany || state.employees[0]?.currentCompany || "PT Indo Tambangraya Megah, Tbk";

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
        <div className="cp-glow">
          <PrismLogo size={56} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 16 }}>
        <button className="btn-ghost" onClick={onBack}>
          ← BACK
        </button>
        <button className="btn-ghost" onClick={() => navigate("/records")}>
          SAVE &amp; CLOSE
        </button>
        {emailSupported && (
          <button className="btn-ghost" onClick={generateEmail} disabled={!ready || generatingEmail}>
            {generatingEmail ? "GENERATING…" : announcement?.emailImageUrl ? "REGENERATE EMAIL" : "GENERATE EMAIL PNG"}
          </button>
        )}
        <button className="btn" onClick={generate} disabled={!ready || generating}>
          {generating ? "GENERATING…" : announcement?.pdfUrl ? "REGENERATE PDF" : "GENERATE PDF"}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.08fr", gap: 20, alignItems: "start" }}>
        {/* editor / status */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ready ? (
            <div className="alert alert-ok" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  background: "rgba(52,211,153,0.18)",
                  color: "#34d399",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 15,
                  fontWeight: 700,
                  flex: "0 0 auto",
                  boxShadow: "0 0 10px rgba(52,211,153,0.4)",
                }}
              >
                ✓
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>READY TO GENERATE</div>
                <div style={{ fontSize: 10.5, color: "rgba(255,150,190,0.55)", marginTop: 1 }}>
                  All required fields validated. No conflicts detected.
                </div>
              </div>
            </div>
          ) : (
            <div className="alert alert-warn">
              <strong>Generation blocked — resolve {failedRules.length || (narration?.blocked ? 1 : 0)} issue(s):</strong>
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {narration?.blocked && <li>{narration.blockReason}</li>}
                {failedRules.map((r) => (
                  <li key={r.code}>{r.message ?? r.label}</li>
                ))}
              </ul>
              <div style={{ marginTop: 8 }}>
                <button className="btn-ghost" style={{ height: 34 }} onClick={onBack}>
                  ← EDIT DETAILS
                </button>
              </div>
            </div>
          )}

          <div className="panel">
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13, color: "var(--text)", marginBottom: 14 }}>
              Announcement &amp; Signatory
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontFamily: "var(--font-mono)" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="label">// NUMBER</div>
                <div className="input" style={{ minHeight: 38, fontSize: 12 }}>{announcement?.number}</div>
              </div>
              <div>
                <div className="label">// SIGNATORY</div>
                <div className="input" style={{ minHeight: 38, fontSize: 12 }}>{announcement?.signatory?.name ?? "—"}</div>
              </div>
              <div>
                <div className="label">// TITLE</div>
                <div className="input" style={{ minHeight: 38, fontSize: 12 }}>{announcement?.signatory?.title ?? "—"}</div>
              </div>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(255,42,109,0.3)", background: "rgba(255,42,109,0.05)", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-head)" }}>
                <PrismLogo size={22} glow={false} />
                <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text)" }}>Generated Narration</span>
              </div>
              <button className="btn-ghost" style={{ height: 30, padding: "0 11px" }} onClick={refresh}>
                ↻ REGEN
              </button>
            </div>
            <div style={{ padding: 14, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(177,74,237,0.2)", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, color: "rgba(255,214,231,0.9)" }}>
              {narrationLines.length === 0 ? (
                <span style={{ color: "rgba(255,150,190,0.5)" }}>No narration yet.</span>
              ) : (
                narrationLines.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#ff5a8c" }}>•</span>
                    <span>{line}</span>
                  </div>
                ))
              )}
              {narration?.effectiveSentence && (
                <div style={{ marginTop: 10, color: "rgba(255,150,190,0.8)" }}>{narration.effectiveSentence}</div>
              )}
            </div>
            <InfoNote style={{ marginTop: 11 }}>
              Tense is date-aware — computed from the effective date versus the announcement date.
            </InfoNote>
          </div>
        </div>

        {/* letter */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid rgba(177,74,237,0.28)", background: "rgba(177,74,237,0.03)", fontFamily: "var(--font-mono)" }}>
            <span style={{ fontSize: 11.5, color: "var(--text)", fontWeight: 700 }}>OFFICIAL ITM LETTER</span>
            <span style={{ fontSize: 10.5, color: "rgba(255,150,190,0.45)" }}>A4 · PORTRAIT</span>
          </div>
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(177,74,237,0.2)", padding: 26, display: "flex", justifyContent: "center" }}>
            {announcement && (
              <LetterPreview
                data={{
                  announcementNumber: announcement.number,
                  movementType: announcement.movementType,
                  companyName,
                  narrationLines,
                  effectiveSentence: narration?.effectiveSentence ?? "",
                  city: announcement.city,
                  announcementDate: announcement.announcementDate,
                  signatoryName: announcement.signatory?.name ?? "",
                  signatoryTitle: announcement.signatory?.title ?? "",
                  letterheadKey: announcement.letterheadKey,
                }}
              />
            )}
          </div>
          {announcement?.pdfUrl && (
            <a href={announcement.pdfUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textAlign: "center" }}>
              ↓ OPEN GENERATED PDF
            </a>
          )}

          {emailSupported && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: "1px solid rgba(177,74,237,0.28)", background: "rgba(177,74,237,0.03)", fontFamily: "var(--font-mono)", marginTop: 6 }}>
                <span style={{ fontSize: 11.5, color: "var(--text)", fontWeight: 700 }}>BODY EMAIL IMAGE</span>
                <span style={{ fontSize: 10.5, color: "rgba(255,150,190,0.45)" }}>PNG · 1280×720</span>
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(177,74,237,0.2)", padding: 16, display: "flex", justifyContent: "center" }}>
                {announcement?.emailImageUrl ? (
                  <img src={announcement.emailImageUrl} alt="Announcement email" style={{ width: "100%", display: "block", boxShadow: "0 12px 30px -10px rgba(0,0,0,0.6)" }} />
                ) : (
                  <div style={{ color: "rgba(255,150,190,0.5)", fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center", padding: 30 }}>
                    Generate the email PNG to preview the ITM HR announcement graphic.
                  </div>
                )}
              </div>
              {announcement?.emailImageUrl && (
                <a href={announcement.emailImageUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textAlign: "center" }}>
                  ↓ OPEN EMAIL PNG
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
