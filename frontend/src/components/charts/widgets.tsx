import { useState } from "react";
import type { DashboardAnalytics, MovementType } from "../../api/types";
import { FILL, GLOW, INK, LegendChip, MOVEMENT_COLOR, MOVEMENT_GLOW, Tip, fmt, useHoverTip } from "./common";

/* ------------------------- Movement donut ------------------------- */

export function MovementDonut({ data }: { data: { movementType: MovementType; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const R = 58;
  const stroke = 20;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const gap = 0.02 * C; // 2px-ish surface gap between segments

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative", width: 150, height: 150, flex: "0 0 auto" }}>
        <svg width={150} height={150} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={75} cy={75} r={R} fill="none" stroke="rgba(177,74,237,0.12)" strokeWidth={stroke} />
          {total > 0 &&
            data.map((d) => {
              const len = (d.count / total) * C;
              const seg = (
                <circle
                  key={d.movementType}
                  cx={75}
                  cy={75}
                  r={R}
                  fill="none"
                  stroke={MOVEMENT_COLOR[d.movementType]}
                  strokeWidth={stroke}
                  strokeDasharray={`${Math.max(0, len - gap)} ${C - Math.max(0, len - gap)}`}
                  strokeDashoffset={-offset}
                  style={{ filter: `drop-shadow(0 0 5px ${MOVEMENT_GLOW[d.movementType]})`, transition: "stroke-dasharray 700ms" }}
                />
              );
              offset += len;
              return seg;
            })}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 30, fontWeight: 700, color: INK.text, lineHeight: 1 }}>{fmt(total)}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: INK.muted }}>ANNOUNCEMENTS</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.map((d) => (
          <div key={d.movementType} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-mono)", fontSize: 12 }}>
            <span style={{ width: 11, height: 11, borderRadius: 2, background: MOVEMENT_COLOR[d.movementType], boxShadow: `0 0 7px ${MOVEMENT_GLOW[d.movementType]}` }} />
            <span style={{ color: INK.text, width: 92 }}>{d.movementType}</span>
            <span style={{ color: INK.text, fontWeight: 700 }}>{d.count}</span>
            <span style={{ color: INK.muted }}>({total > 0 ? Math.round((d.count / total) * 100) : 0}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- Status funnel ------------------------- */

const STATUS_COLORS: Record<string, { fill: string; glow: string }> = {
  Draft: { fill: "#7c86b8", glow: "#9aa6e6" },
  RequiresReview: { fill: FILL.amber, glow: GLOW.amber },
  ReadyToGenerate: { fill: FILL.purple, glow: GLOW.purple },
  Finalized: { fill: FILL.teal, glow: GLOW.teal },
  Published: { fill: FILL.pink, glow: GLOW.pink },
};

export function StatusFunnel({ data }: { data: DashboardAnalytics["statusFunnel"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {data.map((d) => {
        const c = STATUS_COLORS[d.status] ?? { fill: FILL.purple, glow: GLOW.purple };
        return (
          <div key={d.status} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
            <span style={{ width: 108, color: INK.text, whiteSpace: "nowrap" }}>{d.label}</span>
            <div style={{ flex: 1, height: 18, background: "rgba(0,0,0,0.35)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  width: `${(d.count / max) * 100}%`,
                  minWidth: d.count > 0 ? 3 : 0,
                  background: `linear-gradient(90deg, ${c.fill}, ${c.glow})`,
                  boxShadow: `0 0 9px ${c.glow}55`,
                  borderRadius: 3,
                  transition: "width 700ms",
                }}
              />
            </div>
            <span style={{ width: 30, textAlign: "right", color: INK.text, fontWeight: 700 }}>{d.count}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- Leaderboard ------------------------- */

export function Leaderboard({ items, accent = FILL.pink, glow = GLOW.pink }: { items: { name: string; count: number }[]; accent?: string; glow?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>No data yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((it, i) => (
        <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 9, fontFamily: "var(--font-mono)", fontSize: 11 }}>
          <span style={{ width: 16, color: INK.faint, textAlign: "right" }}>{i + 1}</span>
          <span style={{ width: 120, color: INK.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={it.name}>{it.name}</span>
          <div style={{ flex: 1, height: 10, background: "rgba(0,0,0,0.3)", borderRadius: 2, position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, width: `${(it.count / max) * 100}%`, background: accent, boxShadow: `0 0 6px ${glow}66`, borderRadius: 2 }} />
          </div>
          <span style={{ width: 24, textAlign: "right", color: INK.text, fontWeight: 700 }}>{it.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------- Activity heatmap ------------------------- */

export function ActivityHeatmap({ data, days }: { data: DashboardAnalytics["activity"]; days: number }) {
  const { tip, move, hide } = useHoverTip<{ date: string; count: number }>();
  const counts = new Map(data.map((d) => [d.date, d.count]));
  const max = Math.max(1, ...data.map((d) => d.count));

  // Build the trailing window of `days`, as Sunday-started week columns.
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const lowerBound = new Date(end.getTime() - (days - 1) * 86400000);
  const start = new Date(lowerBound);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay()); // back to Sunday

  const cell = 12;
  const gap = 3;
  const cols: { date: string; count: number }[][] = [];
  let cursor = new Date(start);
  while (cursor <= end) {
    const col: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      col.push({ date: key, count: cursor <= end && cursor >= lowerBound ? counts.get(key) ?? 0 : -1 });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    cols.push(col);
  }

  const color = (c: number) => {
    if (c < 0) return "transparent";
    if (c === 0) return "rgba(177,74,237,0.08)";
    const t = 0.25 + (c / max) * 0.75;
    return `rgba(255,42,109,${t})`;
  };

  const w = cols.length * (cell + gap);
  const h = 7 * (cell + gap);

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <svg width={w} height={h + 16} style={{ display: "block" }}>
        {cols.map((col, ci) =>
          col.map((d, ri) =>
            d.count < 0 ? null : (
              <rect
                key={`${ci}-${ri}`}
                x={ci * (cell + gap)}
                y={ri * (cell + gap)}
                width={cell}
                height={cell}
                rx={2}
                fill={color(d.count)}
                stroke={d.count > 0 ? "rgba(255,90,140,0.4)" : "transparent"}
                strokeWidth={0.5}
                onMouseMove={(e) => move(e, d)}
                onMouseLeave={hide}
                style={{ cursor: "pointer" }}
              />
            )
          )
        )}
      </svg>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, fontFamily: "var(--font-mono)", fontSize: 9.5, color: INK.muted }}>
        less
        {[0.1, 0.35, 0.6, 0.85, 1].map((t) => (
          <span key={t} style={{ width: 10, height: 10, borderRadius: 2, background: t < 0.15 ? "rgba(177,74,237,0.08)" : `rgba(255,42,109,${t})` }} />
        ))}
        more
      </div>
      {tip && (
        <Tip x={tip.x} y={tip.y}>
          <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.date}</div>
          <div>{tip.data.count} announcement{tip.data.count === 1 ? "" : "s"}</div>
        </Tip>
      )}
    </div>
  );
}

/* ------------------------- Contributors ------------------------- */

export function Contributors({ data }: { data: DashboardAnalytics["contributors"] }) {
  const { tip, move, hide } = useHoverTip<DashboardAnalytics["contributors"][number]>();
  const max = Math.max(1, ...data.map((d) => d.total));
  if (data.length === 0)
    return <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>No contributor data yet.</div>;
  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: MOVEMENT_COLOR.Transfer, boxShadow: `0 0 7px ${MOVEMENT_GLOW.Transfer}` }} /> Transfer
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: MOVEMENT_COLOR.Assignment, boxShadow: `0 0 7px ${MOVEMENT_GLOW.Assignment}` }} /> Assignment
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {data.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11 }} onMouseMove={(e) => move(e, c)} onMouseLeave={hide}>
            <span style={{ width: 120, color: INK.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={c.name}>{c.name}</span>
            <div style={{ flex: 1, display: "flex", gap: 2, height: 16, alignItems: "center" }}>
              {c.transfers > 0 && (
                <div style={{ width: `${(c.transfers / max) * 100}%`, height: "100%", background: MOVEMENT_COLOR.Transfer, boxShadow: `0 0 7px ${MOVEMENT_GLOW.Transfer}55`, borderRadius: 2, minWidth: 2 }} />
              )}
              {c.assignments > 0 && (
                <div style={{ width: `${(c.assignments / max) * 100}%`, height: "100%", background: MOVEMENT_COLOR.Assignment, boxShadow: `0 0 7px ${MOVEMENT_GLOW.Assignment}55`, borderRadius: 2, minWidth: 2 }} />
              )}
            </div>
            <span style={{ width: 30, textAlign: "right", color: INK.text, fontWeight: 700 }}>{c.total}</span>
          </div>
        ))}
      </div>
      {tip && (
        <Tip x={tip.x} y={tip.y}>
          <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.name}</div>
          <div style={{ color: MOVEMENT_GLOW.Transfer }}>Transfers: {tip.data.transfers}</div>
          <div style={{ color: MOVEMENT_GLOW.Assignment }}>Assignments: {tip.data.assignments}</div>
          <div style={{ color: INK.muted, marginTop: 2 }}>Total: {tip.data.total}</div>
        </Tip>
      )}
    </div>
  );
}

/* ------------------------- Upcoming pipeline ------------------------- */

export function UpcomingPipeline({ data }: { data: DashboardAnalytics["upcoming"] }) {
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0)
    return <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>No movements take effect in the next 30 days.</div>;
  const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "—");
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {data.map((u, i) => (
        <div
          key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "8px 8px",
            borderLeft: `2px solid ${MOVEMENT_COLOR[u.movementType]}`,
            background: hover === i ? "rgba(177,74,237,0.08)" : "transparent",
            transition: "background 120ms",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span style={{ width: 52, fontSize: 11, fontWeight: 700, color: MOVEMENT_GLOW[u.movementType] }}>{fmtDate(u.date)}</span>
          <span style={{ flex: 1, fontSize: 11.5, color: INK.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {u.employeeName}
            <span style={{ color: INK.muted }}> · {u.from} → {u.to}</span>
          </span>
          <span style={{ fontSize: 9, color: MOVEMENT_COLOR[u.movementType], border: `1px solid ${MOVEMENT_COLOR[u.movementType]}`, padding: "1px 6px", borderRadius: 3 }}>
            {u.movementType === "Transfer" ? "TRF" : "ASG"}
          </span>
        </div>
      ))}
    </div>
  );
}
