import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * "What do you want to create?" pop-up. The intended flow is Transfer Form first
 * (printed & approved), then the Announcement based on it — so Transfer Form leads.
 */
export function CreateModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const card = (opts: { title: string; desc: string; to: string; step: string; accent: string; glow: string }) => (
    <button
      onClick={() => go(opts.to)}
      style={{
        textAlign: "left",
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${opts.accent}`,
        padding: "20px 20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "box-shadow 140ms, transform 140ms",
        boxShadow: `0 0 0 rgba(0,0,0,0)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 20px ${opts.glow}55`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.1em", color: opts.glow }}>{opts.step}</span>
      <span style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 19, color: "var(--text)" }}>{opts.title}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.6)", lineHeight: 1.55 }}>{opts.desc}</span>
    </button>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(5,2,10,0.8)",
        backdropFilter: "blur(3px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(660px, 94vw)",
          background: "var(--panel)",
          border: "1px solid rgba(177,74,237,0.45)",
          boxShadow: "0 30px 90px -20px rgba(0,0,0,0.85), 0 0 40px rgba(177,74,237,0.15)",
          padding: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(177,74,237,0.9)" }}>// CREATE</div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 22, color: "var(--text)", marginTop: 4 }}>What do you want to create?</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,150,190,0.6)", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
          {card({
            step: "// STEP 1",
            title: "Transfer Form",
            desc: "Fill the official ITM transfer form (ITM-F-HR-001) to print and get it approved first.",
            to: "/transfer-forms/new",
            accent: "rgba(255,42,109,0.45)",
            glow: "#ff5a8c",
          })}
          {card({
            step: "// STEP 2",
            title: "Announcement",
            desc: "Generate the official announcement letter + body email — usually from an approved transfer form.",
            to: "/create",
            accent: "rgba(23,169,155,0.5)",
            glow: "#3fe0d0",
          })}
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "rgba(255,150,190,0.45)", marginTop: 16, lineHeight: 1.5 }}>
          Recommended flow: <span style={{ color: "#ff9dc0" }}>Transfer Form</span> → print &amp; approve → <span style={{ color: "#3fe0d0" }}>Announcement</span>.
        </div>
      </div>
    </div>
  );
}
