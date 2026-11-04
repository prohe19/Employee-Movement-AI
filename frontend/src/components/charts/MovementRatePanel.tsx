import type { DashboardAnalytics } from "../../api/types";
import { INK, MOVEMENT_COLOR, MOVEMENT_GLOW, Tip, useCountUp, useHoverTip, useWidth } from "./common";

/**
 * Transfer / Assignment rate. All movements are lateral, so this shows the mix of
 * movement types — a transfer-rate gauge + overall split, and a diverging column
 * chart by department (Transfers ▲ above the baseline, Assignments ▼ below).
 */
export function MovementRatePanel({ data }: { data: DashboardAnalytics["movementRates"] }) {
  const rate = useCountUp(data.transferRate);
  const R = 50;
  const C = 2 * Math.PI * R;
  const frac = data.transferRate / 100;
  const seg = (v: number) => (data.total > 0 ? (v / data.total) * 100 : 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "128px minmax(0, 1fr)", gap: 18, alignItems: "center" }}>
        {/* transfer-rate gauge */}
        <div style={{ position: "relative", width: 126, height: 126 }}>
          <svg width={126} height={126} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={63} cy={63} r={R} fill="none" stroke={MOVEMENT_COLOR.Assignment} strokeOpacity={0.35} strokeWidth={10} />
            <circle cx={63} cy={63} r={R} fill="none" stroke={MOVEMENT_COLOR.Transfer} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${frac * C} ${C}`} style={{ filter: `drop-shadow(0 0 6px ${MOVEMENT_GLOW.Transfer})`, transition: "stroke-dasharray 900ms" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 700, color: INK.text, lineHeight: 1 }}>
              {rate}<span style={{ fontSize: 14 }}>%</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 8.5, color: INK.muted, marginTop: 3, textAlign: "center" }}>TRANSFER<br />RATE</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.total === 0 ? (
            <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 12 }}>No movement data yet.</div>
          ) : (
            <>
              <div style={{ display: "flex", height: 20, gap: 2 }}>
                {([["Transfer", data.transfers], ["Assignment", data.assignments]] as const).map(
                  ([k, v]) =>
                    v > 0 && (
                      <div key={k} title={`${k}: ${v}`} style={{ width: `${seg(v)}%`, background: MOVEMENT_COLOR[k], boxShadow: `0 0 8px ${MOVEMENT_GLOW[k]}66`, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, color: "#0a0410", minWidth: 16 }}>
                        {seg(v) > 10 ? v : ""}
                      </div>
                    )
                )}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {(["Transfer", "Assignment"] as const).map((k) => (
                  <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: MOVEMENT_COLOR[k], boxShadow: `0 0 7px ${MOVEMENT_GLOW[k]}` }} />
                    {k} <span style={{ color: INK.text, fontWeight: 700 }}>{k === "Transfer" ? data.transfers : data.assignments}</span>
                    <span>({seg(k === "Transfer" ? data.transfers : data.assignments).toFixed(0)}%)</span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {data.byDepartment.length > 0 && <DivergingDepartments rows={data.byDepartment} />}
    </div>
  );
}

function DivergingDepartments({ rows }: { rows: DashboardAnalytics["movementRates"]["byDepartment"] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { tip, move, hide } = useHoverTip<DashboardAnalytics["movementRates"]["byDepartment"][number]>();
  const H = 158;
  const zone = 54;
  const baseY = 16 + zone;
  const labelY = baseY + zone + 6;
  const maxMag = Math.max(1, ...rows.map((r) => Math.max(r.transfers, r.assignments)));
  const n = rows.length;
  const innerW = Math.max(1, width - 8);
  const slot = innerW / n;
  const barW = Math.min(30, slot * 0.5);
  const short = (s: string) => (s.length > 11 ? s.slice(0, 10) + "…" : s);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: INK.muted, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 }}>
        By department — <span style={{ color: MOVEMENT_GLOW.Transfer }}>▲ transfers</span> / <span style={{ color: MOVEMENT_GLOW.Assignment }}>▼ assignments</span>
      </div>
      {width > 0 && (
        <svg width={width} height={H} style={{ display: "block", overflow: "visible" }}>
          <line x1={4} x2={width - 4} y1={baseY} y2={baseY} stroke="rgba(177,74,237,0.3)" strokeWidth={1} />
          {rows.map((rrow, i) => {
            const cx = 4 + slot * i + slot / 2;
            const upH = (rrow.transfers / maxMag) * zone;
            const downH = (rrow.assignments / maxMag) * zone;
            const hovered = tip?.data === rrow;
            return (
              <g key={rrow.department} onMouseMove={(e) => move(e, rrow)} onMouseLeave={hide} style={{ cursor: "pointer" }} opacity={tip && !hovered ? 0.5 : 1}>
                {rrow.transfers > 0 && <rect x={cx - barW / 2} y={baseY - upH} width={barW} height={upH} rx={2} fill={MOVEMENT_COLOR.Transfer} style={{ filter: `drop-shadow(0 0 5px ${MOVEMENT_GLOW.Transfer}88)` }} />}
                {rrow.transfers > 0 && <text x={cx} y={baseY - upH - 3} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fontWeight={700} fill={MOVEMENT_GLOW.Transfer}>{rrow.transfers}</text>}
                {rrow.assignments > 0 && <rect x={cx - barW / 2} y={baseY} width={barW} height={downH} rx={2} fill={MOVEMENT_COLOR.Assignment} style={{ filter: `drop-shadow(0 0 5px ${MOVEMENT_GLOW.Assignment}88)` }} />}
                {rrow.assignments > 0 && <text x={cx} y={baseY + downH + 11} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fontWeight={700} fill={MOVEMENT_GLOW.Assignment}>{rrow.assignments}</text>}
                <text x={cx} y={labelY + 14} textAnchor="middle" fontSize={8.5} fontFamily="var(--font-mono)" fill={INK.muted}>{short(rrow.department)}</text>
              </g>
            );
          })}
        </svg>
      )}
      {tip && (
        <Tip x={tip.x} y={tip.y}>
          <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.department}</div>
          <div style={{ color: MOVEMENT_GLOW.Transfer }}>▲ {tip.data.transfers} transfer{tip.data.transfers === 1 ? "" : "s"}</div>
          <div style={{ color: MOVEMENT_GLOW.Assignment }}>▼ {tip.data.assignments} assignment{tip.data.assignments === 1 ? "" : "s"}</div>
          <div style={{ color: INK.muted, marginTop: 2 }}>{tip.data.total} total moves</div>
        </Tip>
      )}
    </div>
  );
}
