import { useEffect, useRef, useState } from "react";
import { formsApi } from "../../api/endpoints";
import { ApiError } from "../../api/client";
import { extractionToEmployees, WizardState } from "./wizardTypes";

interface Props {
  state: WizardState;
  patch: (updates: Partial<WizardState>) => void;
  onDone: () => void;
  onError: () => void;
}

const STAGES = [
  "Refracting the document pages",
  "Locating the movement information section",
  "Extracting employee & position fields",
  "Reading job sequence (JS) & dates",
  "Scoring field confidence",
];

export function ExtractionStep({ state, patch, onDone, onError }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || !state.formId) return;
    started.current = true;

    const ticker = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 700);

    (async () => {
      try {
        const result = await formsApi.extract(state.formId!);
        const { employees, movementType } = extractionToEmployees(result);
        patch({ employees, movementType });
        clearInterval(ticker);
        setStageIndex(STAGES.length);
        setTimeout(onDone, 350);
      } catch (e) {
        clearInterval(ticker);
        setError(e instanceof ApiError ? e.message : "Extraction failed");
      }
    })();

    return () => clearInterval(ticker);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = Math.round((Math.min(stageIndex, STAGES.length) / STAGES.length) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20 }}>
      <div
        style={{
          width: 680,
          maxWidth: "100%",
          border: "1px solid rgba(177,74,237,0.28)",
          background: "rgba(177,74,237,0.03)",
          padding: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 24,
        }}
      >
        <div className="cp-glow" style={{ position: "relative", width: 120, height: 96 }}>
          <svg width="120" height="96" viewBox="0 0 120 96" fill="none">
            <polygon points="60,14 96,82 24,82" fill="rgba(177,74,237,0.05)" stroke="#c98bff" strokeWidth="2.4" strokeLinejoin="round" />
            <line x1="0" y1="72" x2="46" y2="48" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            <line x1="62" y1="44" x2="120" y2="20" stroke="#ff2a6d" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="63" y1="47" x2="120" y2="30" stroke="#ff5a8c" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="64" y1="50" x2="120" y2="40" stroke="#ffd23f" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="65" y1="53" x2="120" y2="50" stroke="#3fe0d0" strokeWidth="2.2" strokeLinecap="round" />
            <line x1="66" y1="56" x2="120" y2="60" stroke="#b14aed" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 20, color: "var(--text)", textShadow: "0 0 14px rgba(255,42,109,0.4)" }}>
            {error ? "Extraction failed" : "Refracting the document"}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "rgba(255,150,190,0.55)", marginTop: 6 }}>
            {error ? error : `Reading ${state.pageCount ?? ""} ${state.fileName ?? "the form"}. This usually takes a few seconds.`}
          </div>
        </div>

        {error ? (
          <button className="btn-ghost" onClick={onError}>
            ← BACK TO UPLOAD
          </button>
        ) : (
          <>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {STAGES.map((label, i) => {
                const done = i < stageIndex || stageIndex >= STAGES.length;
                const active = i === stageIndex && stageIndex < STAGES.length;
                return (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 13,
                      padding: "13px 16px",
                      background: "rgba(177,74,237,0.04)",
                      border: "1px solid rgba(177,74,237,0.15)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 11,
                        fontWeight: 700,
                        flex: "0 0 auto",
                        color: done ? "#fff" : active ? "#fff" : "rgba(255,150,190,0.5)",
                        background: done ? "#34d399" : active ? "#ff2a6d" : "transparent",
                        border: done || active ? "none" : "1px solid rgba(177,74,237,0.3)",
                        boxShadow: active ? "0 0 10px rgba(255,42,109,0.6)" : "none",
                      }}
                    >
                      {done ? "✓" : active ? "…" : i + 1}
                    </div>
                    <span style={{ fontSize: 13, color: done || active ? "var(--text)" : "rgba(255,150,190,0.5)", flex: 1 }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ width: "100%" }}>
              <div style={{ height: 6, background: "rgba(177,74,237,0.12)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    background: "linear-gradient(90deg,#ff2a6d,#b14aed)",
                    boxShadow: "0 0 10px rgba(255,42,109,0.5)",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-mono)" }}>
                <span style={{ fontSize: 11, color: "rgba(255,150,190,0.45)" }}>Extracting fields…</span>
                <span style={{ fontSize: 11, color: "#ff5a8c", fontWeight: 700 }}>{progress}%</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
