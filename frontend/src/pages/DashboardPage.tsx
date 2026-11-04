import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { PrismLogo } from "../components/PrismLogo";
import { dashboardApi } from "../api/endpoints";
import type { DashboardAnalytics, FlowDimension } from "../api/types";
import { FILL, GLOW, INK, Panel, fmt, useCountUp } from "../components/charts/common";
import { MovementSankey } from "../components/charts/MovementSankey";
import { OperationsMap } from "../components/charts/OperationsMap";
import { PromotionPanel } from "../components/charts/PromotionPanel";
import { TrendArea } from "../components/charts/TrendArea";
import {
  ActivityHeatmap,
  Contributors,
  Leaderboard,
  MovementDonut,
  StatusFunnel,
  UpcomingPipeline,
} from "../components/charts/widgets";

const FLOW_DIMS: { key: FlowDimension; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "department", label: "Department" },
];

const LB_TABS = [
  { key: "destinations", label: "Destinations", accent: FILL.teal, glow: GLOW.teal },
  { key: "origins", label: "Origins", accent: FILL.pink, glow: GLOW.pink },
  { key: "departments", label: "Departments", accent: FILL.purple, glow: GLOW.purple },
] as const;

const RANGES = [
  { key: "1m", label: "This month", days: 31 },
  { key: "3m", label: "3 months", days: 93 },
  { key: "6m", label: "6 months", days: 183 },
  { key: "1y", label: "1 year", days: 365 },
  { key: "all", label: "All time", days: 0 },
] as const;

const GRID_CSS = `
.dash-grid { display: grid; gap: 16px; margin-top: 16px; }
.dash-full { grid-template-columns: minmax(0, 1fr); }
.dash-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.dash-r2 { grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); align-items: stretch; }
.dash-r2 .r2-left { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
@media (max-width: 1180px) { .dash-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 860px) { .dash-3, .dash-r2 { grid-template-columns: minmax(0, 1fr); } }
`;

export function DashboardPage() {
  const [a, setA] = useState<DashboardAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flowDim, setFlowDim] = useState<FlowDimension>("company");
  const [lbTab, setLbTab] = useState<(typeof LB_TABS)[number]["key"]>("destinations");
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("6m");

  useEffect(() => {
    dashboardApi.analytics().then(setA).catch((e) => setError(e.message));
  }, []);

  const activityDays = useMemo(() => {
    const sel = RANGES.find((r) => r.key === range)!;
    if (sel.days > 0) return sel.days;
    if (!a || a.activity.length === 0) return 183;
    const earliest = new Date(a.activity[0].date).getTime();
    return Math.max(31, Math.ceil((Date.now() - earliest) / 86400000) + 7);
  }, [range, a]);

  if (error)
    return (
      <AppShell eyebrow="// COMMAND CENTER" title="Dashboard">
        <div className="alert alert-error" style={{ marginTop: 18 }}>{error}</div>
      </AppShell>
    );

  if (!a)
    return (
      <AppShell eyebrow="// COMMAND CENTER" title="Dashboard">
        <div style={{ display: "flex", justifyContent: "center", padding: 80 }}>
          <div className="cp-glow"><PrismLogo size={56} /></div>
        </div>
      </AppShell>
    );

  const empty = a.kpis.employeesMoved === 0;
  const rangeSelect = (
    <select
      value={range}
      onChange={(e) => setRange(e.target.value as (typeof RANGES)[number]["key"])}
      style={{ background: "rgba(10,4,16,0.9)", color: INK.text, border: "1px solid rgba(177,74,237,0.5)", borderRadius: 3, fontFamily: "var(--font-mono)", fontSize: 10.5, padding: "5px 8px", cursor: "pointer" }}
    >
      {RANGES.map((r) => (
        <option key={r.key} value={r.key} style={{ background: "#0a0410" }}>{r.label}</option>
      ))}
    </select>
  );

  return (
    <AppShell
      eyebrow="// COMMAND CENTER"
      title="Dashboard"
      actions={
        <Link to="/create" className="btn" style={{ textDecoration: "none" }}>
          + NEW ANNOUNCEMENT
        </Link>
      }
    >
      <style>{GRID_CSS}</style>

      {empty && (
        <div className="alert" style={{ marginTop: 18, borderColor: "rgba(177,74,237,0.4)", background: "rgba(177,74,237,0.06)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
          The charts are hungry 🍽️ — there's no movement data yet. Load a rich demo set with&nbsp;
          <code style={{ color: GLOW.teal }}>npm run seed:demo</code>&nbsp;(remove later with <code style={{ color: GLOW.pink }}>npm run seed:demo -- --clear</code>).
        </div>
      )}

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 14, marginTop: 20 }}>
        <Kpi label="Total Announcements" value={a.kpis.totalAnnouncements} color={GLOW.pink} />
        <Kpi label="Employees Moved" value={a.kpis.employeesMoved} color={GLOW.teal} />
        <Kpi label="Promotion Rate" value={a.kpis.promotionRate} suffix="%" color="#34d399" />
        <Kpi label="Requires Review" value={a.kpis.requiresReview} color={GLOW.amber} />
        <Kpi label="Next 30 Days" value={a.kpis.upcoming30} color={GLOW.purple} />
      </div>

      {/* operations map (full width) */}
      <div className="dash-grid dash-full">
        <Panel title="Operations Map" subtitle="Site movement network — node size = volume, arcs = transfers">
          <OperationsMap nodes={a.map.nodes} arcs={a.map.arcs} />
        </Panel>
      </div>

      {/* activity + promotions (left stack) | movement flow (tall) */}
      <div className="dash-grid dash-r2">
        <div className="r2-left">
          <Panel title="Activity" subtitle="Announcements per day" right={rangeSelect}>
            <ActivityHeatmap data={a.activity} days={activityDays} />
          </Panel>
          <Panel title="Promotions / Assignment" subtitle="Job-scale movement">
            <PromotionPanel data={a.promotions} />
          </Panel>
        </div>
        <Panel
          title="Movement Flow"
          subtitle={`Origin → destination by ${flowDim}`}
          right={
            <div style={{ display: "flex", gap: 4 }}>
              {FLOW_DIMS.map((d) => (
                <button key={d.key} onClick={() => setFlowDim(d.key)} className="btn-ghost" style={{ height: 26, padding: "0 9px", fontSize: 9.5, borderColor: flowDim === d.key ? FILL.pink : undefined, color: flowDim === d.key ? GLOW.pink : undefined }}>
                  {d.label}
                </button>
              ))}
            </div>
          }
        >
          <MovementSankey links={a.flows[flowDim]} height={560} />
        </Panel>
      </div>

      {/* trend + type split + leaderboards */}
      <div className="dash-grid dash-3">
        <Panel title="Movement Trend" subtitle="Last 12 months">
          <TrendArea data={a.trend} />
        </Panel>
        <Panel title="Type Split" subtitle="Transfer vs Assignment">
          <MovementDonut data={a.movementDistribution} />
        </Panel>
        <Panel
          title="Leaderboards"
          subtitle="Busiest by movement count"
          right={
            <div style={{ display: "flex", gap: 4 }}>
              {LB_TABS.map((t) => (
                <button key={t.key} onClick={() => setLbTab(t.key)} className="btn-ghost" style={{ height: 26, padding: "0 9px", fontSize: 9.5, borderColor: lbTab === t.key ? t.accent : undefined, color: lbTab === t.key ? t.glow : undefined }}>
                  {t.label}
                </button>
              ))}
            </div>
          }
        >
          <Leaderboard items={a.leaderboards[lbTab]} accent={LB_TABS.find((t) => t.key === lbTab)!.accent} glow={LB_TABS.find((t) => t.key === lbTab)!.glow} />
        </Panel>
      </div>

      {/* contributors + status funnel + upcoming */}
      <div className="dash-grid dash-3">
        <Panel title="Contributors" subtitle="Who entered the data — by movement type">
          <Contributors data={a.contributors} />
        </Panel>
        <Panel title="Status Funnel" subtitle="Pipeline">
          <StatusFunnel data={a.statusFunnel} />
        </Panel>
        <Panel title="Upcoming Pipeline" subtitle="Effective in the next 30 days">
          <UpcomingPipeline data={a.upcoming} />
        </Panel>
      </div>
    </AppShell>
  );
}

function Kpi({ label, value, color, suffix }: { label: string; value: number; color: string; suffix?: string }) {
  const v = useCountUp(value);
  return (
    <div style={{ background: "var(--panel)", border: "1px solid rgba(255,42,109,0.2)", padding: "14px 16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: color, boxShadow: `0 0 10px ${color}` }} />
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(177,74,237,0.9)", textTransform: "uppercase" }}>
        // {label}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 32, color, marginTop: 8, textShadow: `0 0 16px ${color}55`, lineHeight: 1 }}>
        {fmt(v)}{suffix}
      </div>
    </div>
  );
}
