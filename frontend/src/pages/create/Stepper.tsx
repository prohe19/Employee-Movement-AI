const STEPS = ["UPLOAD", "EXTRACTION", "REVIEW", "DETAILS", "PREVIEW"];

export function Stepper({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 22,
        fontFamily: "var(--font-mono)",
      }}
    >
      {STEPS.map((label, i) => {
        const stepNumber = i + 1;
        const active = stepNumber === current;
        const done = stepNumber < current;
        return (
          <div key={label} style={{ display: "contents" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 700,
                  color: active || done ? "#fff" : "rgba(255,150,190,0.5)",
                  background: active ? "#ff2a6d" : done ? "rgba(255,42,109,0.35)" : "transparent",
                  border: active || done ? "none" : "1px solid rgba(177,74,237,0.4)",
                  boxShadow: active ? "0 0 12px rgba(255,42,109,0.6)" : "none",
                }}
              >
                {done ? "✓" : stepNumber}
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  color: active ? "var(--text)" : "rgba(255,150,190,0.5)",
                  fontWeight: active ? 700 : 400,
                }}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: "rgba(177,74,237,0.25)" }} />}
          </div>
        );
      })}
    </div>
  );
}
