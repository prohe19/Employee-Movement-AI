interface PrismLogoProps {
  size?: number;
  glow?: boolean;
}

/** The Dark-Side-of-the-Moon prism refracting a white beam into a neon spectrum. */
export function PrismLogo({ size = 38, glow = true }: PrismLogoProps) {
  const height = (size * 40) / 52;
  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 52 40"
      fill="none"
      style={glow ? { filter: "drop-shadow(0 0 8px rgba(255,42,109,0.5))" } : undefined}
    >
      <line x1="0" y1="31" x2="20" y2="20" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <polygon
        points="25,5 43,35 8,35"
        fill="rgba(177,74,237,0.06)"
        stroke="#c98bff"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <line x1="26" y1="18" x2="52" y2="9" stroke="#ff2a6d" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="26.5" y1="19.5" x2="52" y2="13" stroke="#ff5a8c" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="27" y1="21" x2="52" y2="17" stroke="#ffd23f" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="27.5" y1="22.5" x2="52" y2="21" stroke="#3fe0d0" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="28" y1="24" x2="52" y2="25" stroke="#b14aed" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function BrandLockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <PrismLogo size={38} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span
          style={{
            fontFamily: "var(--font-head)",
            fontWeight: 700,
            fontSize: 14.5,
            color: "var(--text)",
            letterSpacing: "0.04em",
          }}
        >
          ITM HR COMMUNICATION
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "rgba(177,74,237,0.85)",
          }}
        >
          // EMPLOYEE MOVEMENT ANALYSIS
        </span>
      </div>
    </div>
  );
}
