import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Shared chart theme + primitives for the dashboard.
 *
 * FILL colors are the CVD-validated categorical palette (dark surface):
 *   pink #ff2a6d · teal #17a99b · purple #b14aed · amber #c08a10
 * GLOW colors are the brighter neon variants, used ONLY for strokes/glows/gradients
 * (decorative), never as the identity-bearing fill.
 */
export const FILL = {
  pink: "#ff2a6d",
  teal: "#17a99b",
  purple: "#b14aed",
  amber: "#c08a10",
} as const;

export const GLOW = {
  pink: "#ff5a8c",
  teal: "#3fe0d0",
  purple: "#c98bff",
  amber: "#fbbf24",
} as const;

// Movement types have a fixed identity color (never cycled).
export const MOVEMENT_COLOR = {
  Transfer: FILL.pink,
  Assignment: FILL.teal,
} as const;
export const MOVEMENT_GLOW = {
  Transfer: GLOW.pink,
  Assignment: GLOW.teal,
} as const;

// Promotion outcomes are STATUS colors (good/neutral/bad) — always shown with labels.
export const PROMO = {
  up: { fill: "#2fb98b", glow: "#34d399", label: "Promotion", icon: "▲" },
  lateral: { fill: "#7c86b8", glow: "#9aa6e6", label: "Lateral", icon: "▬" },
  down: { fill: "#d6456b", glow: "#ff6a8a", label: "Step down", icon: "▼" },
  unknown: { fill: "#4a4458", glow: "#6a6480", label: "Not specified", icon: "·" },
} as const;

export const INK = {
  text: "#ffd6e7",
  muted: "rgba(255,150,190,0.55)",
  faint: "rgba(255,150,190,0.3)",
  grid: "rgba(177,74,237,0.16)",
};

export function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Animated count-up for KPI numbers. */
export function useCountUp(target: number, duration = 900): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/** Floating tooltip anchored to the cursor. */
export function useHoverTip<T>() {
  const [tip, setTip] = useState<{ x: number; y: number; data: T } | null>(null);
  const move = (e: { clientX: number; clientY: number }, data: T) =>
    setTip({ x: e.clientX, y: e.clientY, data });
  const hide = () => setTip(null);
  return { tip, move, hide };
}

export function Tip({
  x,
  y,
  children,
}: {
  x: number;
  y: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "fixed",
        left: x + 14,
        top: y + 14,
        zIndex: 60,
        pointerEvents: "none",
        background: "rgba(10,4,16,0.96)",
        border: "1px solid rgba(177,74,237,0.5)",
        boxShadow: "0 10px 30px -8px rgba(0,0,0,0.8), 0 0 14px rgba(177,74,237,0.25)",
        padding: "8px 11px",
        fontFamily: "var(--font-mono)",
        fontSize: 11.5,
        color: INK.text,
        lineHeight: 1.5,
        maxWidth: 260,
      }}
    >
      {children}
    </div>
  );
}

/** Standard dashboard panel with a header strip. */
export function Panel({
  title,
  subtitle,
  right,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: "var(--panel)",
        border: "1px solid rgba(177,74,237,0.22)",
        boxShadow: "inset 0 0 40px rgba(177,74,237,0.04)",
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid rgba(177,74,237,0.18)",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-head)",
              fontWeight: 700,
              fontSize: 12.5,
              letterSpacing: 0.4,
              color: INK.text,
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: INK.muted, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        {right}
      </div>
      <div style={{ padding: 16, flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

/** A compact legend chip (identity color + label), used so color is never alone. */
export function LegendChip({ color, label, glow }: { color: string; label: string; glow?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
      <span
        style={{
          width: 10,
          height: 10,
          borderRadius: 2,
          background: color,
          boxShadow: glow ? `0 0 7px ${glow}` : undefined,
          flex: "0 0 auto",
        }}
      />
      {label}
    </span>
  );
}

/** Measures its container width (for responsive SVG charts). */
export function useWidth<E extends HTMLElement>() {
  const ref = useRef<E>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}
