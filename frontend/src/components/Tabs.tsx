/** Simple neon-themed tab bar used on the Settings and Records pages. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (key: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(177,74,237,0.25)", marginTop: 22 }}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: isActive ? "2px solid #ff2a6d" : "2px solid transparent",
              padding: "10px 16px",
              marginBottom: -1,
              cursor: "pointer",
              fontFamily: "var(--font-head)",
              fontSize: 12.5,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: isActive ? "#fff" : "rgba(255,150,190,0.6)",
              textShadow: isActive ? "0 0 12px rgba(255,42,109,0.6)" : "none",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
