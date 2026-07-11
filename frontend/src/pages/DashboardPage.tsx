import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StatusPill } from "../components/ui";
import { dashboardApi } from "../api/endpoints";
import type { DashboardSummary } from "../api/types";
import { formatUiDate, MOVEMENT_TYPE_LABELS } from "../lib/format";

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dashboardApi
      .summary()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const maxDist = Math.max(1, ...(data?.movementDistribution.map((d) => d.count) ?? [1]));

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
      {error && <div className="alert alert-error" style={{ marginTop: 18 }}>{error}</div>}

      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 22 }}>
        <KpiCard label="TOTAL ANNOUNCEMENTS" value={data?.kpis.totalAnnouncements} color="#ff5a8c" />
        <KpiCard label="REQUIRES REVIEW" value={data?.kpis.requiresReview} color="#fbbf24" />
        <KpiCard label="READY TO GENERATE" value={data?.kpis.readyToGenerate} color="#34d399" />
        <KpiCard label="FINALIZED THIS MONTH" value={data?.kpis.finalizedThisMonth} color="#3fe0d0" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16, alignItems: "start" }}>
        {/* movement distribution */}
        <div className="panel">
          <div className="eyebrow">// MOVEMENT DISTRIBUTION</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.movementDistribution ?? []).length === 0 && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>No data yet.</div>
            )}
            {data?.movementDistribution.map((d) => (
              <div key={d.movementType} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                <span style={{ width: 150, color: "rgba(255,150,190,0.7)" }}>{MOVEMENT_TYPE_LABELS[d.movementType]}</span>
                <span style={{ flex: 1, height: 8, background: "rgba(177,74,237,0.12)", position: "relative" }}>
                  <span style={{ position: "absolute", inset: 0, width: `${(d.count / maxDist) * 100}%`, background: "linear-gradient(90deg,#ff2a6d,#b14aed)", boxShadow: "0 0 8px rgba(255,42,109,0.4)" }} />
                </span>
                <span style={{ color: "var(--text)", fontWeight: 700, width: 30, textAlign: "right" }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* upcoming effective dates */}
        <div className="panel">
          <div className="eyebrow">// UPCOMING EFFECTIVE DATES</div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {(data?.upcomingEffectiveDates ?? []).length === 0 && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>Nothing in the next 30 days.</div>
            )}
            {data?.upcomingEffectiveDates.map((e) => (
              <div key={e.id} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: 11.5, borderBottom: "1px solid rgba(177,74,237,0.12)", paddingBottom: 8 }}>
                <span style={{ color: "var(--text)" }}>{e.employeeName}</span>
                <span style={{ color: "#ff5a8c" }}>{formatUiDate(e.effectiveDate)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* recent announcements */}
      <div className="panel" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="eyebrow">// RECENT ANNOUNCEMENTS</div>
          <Link to="/records" style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
            VIEW ALL →
          </Link>
        </div>
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column" }}>
          {(data?.recentAnnouncements ?? []).length === 0 && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>
              No announcements yet — <Link to="/create">create your first</Link>.
            </div>
          )}
          {data?.recentAnnouncements.map((a) => (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1.3fr 1fr 1fr",
                alignItems: "center",
                padding: "12px 0",
                borderBottom: "1px solid rgba(177,74,237,0.1)",
                fontFamily: "var(--font-mono)",
                fontSize: 11.5,
              }}
            >
              <span style={{ color: "var(--text)", fontWeight: 700 }}>{a.number}</span>
              <span style={{ color: "rgba(255,150,190,0.7)" }}>{a.employees[0]?.employeeName ?? "—"}</span>
              <span style={{ color: "rgba(255,150,190,0.6)" }}>{MOVEMENT_TYPE_LABELS[a.movementType]}</span>
              <span style={{ justifySelf: "end" }}>
                <StatusPill status={a.status} />
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({ label, value, color }: { label: string; value?: number; color: string }) {
  return (
    <div className="panel" style={{ borderColor: "rgba(255,42,109,0.2)" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(177,74,237,0.9)" }}>
        // {label}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 34, color, marginTop: 10, textShadow: `0 0 16px ${color}55` }}>
        {value ?? "—"}
      </div>
    </div>
  );
}
