import type { DashboardAnalytics } from "../../api/types";
import { INK, PROMO, Tip, useCountUp, useHoverTip, useWidth } from "./common";

/**
 * Promotion / job-scale story: a promotion-rate gauge + overall split, and a diverging
 * column chart by department — promotions ▲ above the baseline, step-downs ▼ below.
 */
export function PromotionPanel({ data }: { data: DashboardAnalytics["promotions"] }) {
  const known = data.up + data.lateral + data.down;
  const rate = useCountUp(data.promotionRate);
  const R = 50;
  const C = 2 * Math.PI * R;
  const frac = data.promotionRate / 100;
  const seg = (v: number) => (known > 0 ? (v / known) * 100 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* top: gauge + overall split */}
      <div style={{ display: "grid", gridTemplateColumns: "128px minmax(0, 1fr)", gap: 18, alignItems: "center" }}>
        <div style={{ position: "relative", width: 126, height: 126 }}>
          <svg width={126} height={126} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={63} cy={63} r={R} fill="none" stroke="rgba(177,74,237,0.14)" strokeWidth={10} />
            <circle cx={63} cy={63} r={R} fill="none" stroke={PROMO.up.fill} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} style={{ filter: `drop-shadow(0 0 6px ${PROMO.up.glow})`, transition: "stroke-dasharray 900ms" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 700, color: INK.text, lineHeight: 1 }}>
              {rate}<span style={{ fontSize: 14 }}>%</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: INK.muted, marginTop: 3, textAlign: "center" }}>PROMOTION<br />RATE</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {known === 0 ? (
            <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 12 }}>No job-scale data yet.</div>
          ) : (
            <>
              <div style={{ display: "flex", height: 20, gap: 2 }}>
                {([["up", data.up], ["lateral", data.lateral], ["down", data.down]] as const).map(
                  ([k, v]) =>
                    v > 0 && (
                      <div key={k} title={`${PROMO[k].label}: ${v}`} style={{ width: `${seg(v)}%`, background: PROMO[k].fill, boxShadow: `0 0 8px ${PROMO[k].glow}66`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#0a0410", minWidth: 16 }}>
                        {seg(v) > 10 ? v : ""}
                      </div>
                    )
                )}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {(["up", "lateral", "down"] as const).map((k) => (
                  <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
                    <span style={{ color: PROMO[k].fill, fontWeight: 700 }}>{PROMO[k].icon}</span>
                    {PROMO[k].label} <span style={{ color: INK.text, fontWeight: 700 }}>{data[k]}</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* diverging columns by department */}
      {data.byDepartment.length > 0 && <DivergingDepartments rows={data.byDepartment} />}
    </div>
  );
}

function DivergingDepartments({ rows }: { rows: DashboardAnalytics["promotions"]["byDepartment"] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { tip, move, hide } = useHoverTip<DashboardAnalytics["promotions"]["byDepartment"][number]>();
  const H = 158;
  const zone = 54; // half-height for up / down bars
  const baseY = 16 + zone;
  const labelY = baseY + zone + 6;
  const maxMag = Math.max(1, ...rows.map((r) => Math.max(r.up, r.down)));
  const n = rows.length;
  const innerW = Math.max(1, width - 8);
  const slot = innerW / n;
  const barW = Math.min(30, slot * 0.5);

  const short = (s: string) => (s.length > 11 ? s.slice(0, 10) + "…" : s);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: INK.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
        By department — <span style={{ color: PROMO.up.fill }}>▲ promotions</span> / <span style={{ color: PROMO.down.fill }}>▼ step-downs</span>
      </div>
      {width > 0 && (
        <svg width={width} height={H} style={{ display: "block", overflow: "visible" }}>
          <line x1={4} x2={width - 4} y1={baseY} y2={baseY} stroke="rgba(177,74,237,0.3)" strokeWidth={1} />
          {rows.map((rrow, i) => {
            const cx = 4 + slot * i + slot / 2;
            const upH = (rrow.up / maxMag) * zone;
            const downH = (rrow.down / maxMag) * zone;
            const hovered = tip?.data === rrow;
            return (
              <g key={rrow.department} onMouseMove={(e) => move(e, rrow)} onMouseLeave={hide} style={{ cursor: "pointer" }} opacity={tip && !hovered ? 0.5 : 1}>
                {rrow.up > 0 && <rect x={cx - barW / 2} y={baseY - upH} width={barW} height={upH} rx={2} fill={PROMO.up.fill} style={{ filter: `drop-shadow(0 0 5px ${PROMO.up.glow}88)` }} />}
                {rrow.up > 0 && <text x={cx} y={baseY - upH - 3} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fontWeight={700} fill={PROMO.up.glow}>{rrow.up}</text>}
                {rrow.down > 0 && <rect x={cx - barW / 2} y={baseY} width={barW} height={downH} rx={2} fill={PROMO.down.fill} style={{ filter: `drop-shadow(0 0 5px ${PROMO.down.glow}88)` }} />}
                {rrow.down > 0 && <text x={cx} y={baseY + downH + 11} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fontWeight={700} fill={PROMO.down.glow}>{rrow.down}</text>}
                <text x={cx} y={labelY + 14} textAnchor="middle" fontSize={8.5} fontFamily="var(--font-mono)" fill={INK.muted}>{short(rrow.department)}</text>
              </g>
            );
          })}
        </svg>
      )}
      {tip && (
        <Tip x={tip.x} y={tip.y}>
          <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.department}</div>
          <div style={{ color: PROMO.up.glow }}>▲ {tip.data.up} promotion{tip.data.up === 1 ? "" : "s"}</div>
          <div style={{ color: PROMO.down.glow }}>▼ {tip.data.down} step-down{tip.data.down === 1 ? "" : "s"}</div>
          <div style={{ color: INK.muted, marginTop: 2 }}>{tip.data.total} total moves</div>
        </Tip>
      )}
    </div>
  );
}
