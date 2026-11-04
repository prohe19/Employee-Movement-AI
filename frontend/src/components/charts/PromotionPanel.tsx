import type { DashboardAnalytics } from "../../api/types";
import { INK, PROMO, useCountUp } from "./common";

/**
 * Promotion / job-scale story: a promotion-rate gauge, the promotion vs lateral vs
 * step-down split (status colors, always labelled), and the top promoting departments.
 */
export function PromotionPanel({ data }: { data: DashboardAnalytics["promotions"] }) {
  const known = data.up + data.lateral + data.down;
  const rate = useCountUp(data.promotionRate);

  // Gauge (3/4 arc).
  const R = 52;
  const C = 2 * Math.PI * R;
  const frac = data.promotionRate / 100;

  const seg = (v: number) => (known > 0 ? (v / known) * 100 : 0);
  const maxDept = Math.max(1, ...data.byDepartment.map((d) => d.total));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px minmax(0, 1fr)", gap: 18, alignItems: "center" }}>
      {/* gauge */}
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={70} cy={70} r={R} fill="none" stroke="rgba(177,74,237,0.14)" strokeWidth={11} />
          <circle
            cx={70}
            cy={70}
            r={R}
            fill="none"
            stroke={PROMO.up.fill}
            strokeWidth={11}
            strokeLinecap="round"
            strokeDasharray={`${frac * C} ${C}`}
            style={{ filter: `drop-shadow(0 0 6px ${PROMO.up.glow})`, transition: "stroke-dasharray 900ms" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 30, fontWeight: 700, color: INK.text, lineHeight: 1 }}>
            {rate}<span style={{ fontSize: 15 }}>%</span>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, color: INK.muted, marginTop: 3, textAlign: "center" }}>
            PROMOTION<br />RATE
          </div>
        </div>
      </div>

      {/* split + departments */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {known === 0 ? (
          <div style={{ color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 12 }}>
            No job-scale data yet — promotions need the current/new JS fields.
          </div>
        ) : (
          <>
            {/* segmented bar */}
            <div style={{ display: "flex", height: 22, gap: 2 }}>
              {([["up", data.up], ["lateral", data.lateral], ["down", data.down]] as const).map(
                ([k, v]) =>
                  v > 0 && (
                    <div
                      key={k}
                      title={`${PROMO[k].label}: ${v}`}
                      style={{
                        width: `${seg(v)}%`,
                        background: PROMO[k].fill,
                        boxShadow: `0 0 8px ${PROMO[k].glow}66`,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#0a0410",
                        minWidth: 18,
                      }}
                    >
                      {seg(v) > 10 ? v : ""}
                    </div>
                  )
              )}
            </div>
            {/* legend with icons + labels (never color alone) */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {(["up", "lateral", "down"] as const).map((k) => (
                <span key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-mono)", fontSize: 10.5, color: INK.muted }}>
                  <span style={{ color: PROMO[k].fill, fontWeight: 700 }}>{PROMO[k].icon}</span>
                  {PROMO[k].label} <span style={{ color: INK.text, fontWeight: 700 }}>{data[k]}</span>
                </span>
              ))}
            </div>

            {/* top promoting departments */}
            {data.byDepartment.length > 0 && (
              <div style={{ marginTop: 2 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: INK.muted, marginBottom: 7, textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Top promoting departments
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {data.byDepartment.map((d) => (
                    <div key={d.department} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11 }}>
                      <span style={{ flex: "1 1 60px", minWidth: 0, maxWidth: 150, color: INK.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.department}</span>
                      <div style={{ flex: 1, position: "relative", height: 9, background: "rgba(0,0,0,0.35)", borderRadius: 2 }}>
                        <span style={{ position: "absolute", inset: 0, width: `${(d.up / maxDept) * 100}%`, background: PROMO.up.fill, boxShadow: `0 0 6px ${PROMO.up.glow}66`, borderRadius: 2 }} />
                      </div>
                      <span style={{ width: 54, textAlign: "right", color: INK.muted }}>
                        <span style={{ color: PROMO.up.fill, fontWeight: 700 }}>{d.up}</span>/{d.total}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
