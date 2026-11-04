import type { MovementType } from "@prisma/client";
import { prisma } from "../lib/prisma";

/**
 * Rich dashboard analytics. Aggregates the before→after movement data (company,
 * location, department) into flows, a geographic site map, Transfer/Assignment
 * rates, trends, a status funnel, leaderboards and an activity heatmap.
 *
 * Volumes for HR announcements are modest, so we fetch the rows once and aggregate
 * in JS — far simpler than expressing flow/rate logic in SQL.
 */

type FlowDim = "company" | "location" | "department";

interface FlowLink {
  source: string;
  target: string;
  value: number;
}

interface SiteNode {
  name: string;
  lat: number;
  lng: number;
  inbound: number;
  outbound: number;
  total: number;
}

interface SiteArc {
  from: string;
  to: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  value: number;
}

// Approximate coordinates for ITM group operating sites + common cities. Keyed by a
// normalized token; matched by substring so "Bontang Site" → Bontang, etc.
const SITE_COORDS: { key: string; lat: number; lng: number; label: string }[] = [
  { key: "jakarta", lat: -6.2088, lng: 106.8456, label: "Jakarta" },
  { key: "balikpapan", lat: -1.2635, lng: 116.8311, label: "Balikpapan" },
  { key: "samarinda", lat: -0.5022, lng: 117.1536, label: "Samarinda" },
  { key: "bontang", lat: 0.1322, lng: 117.479, label: "Bontang" },
  { key: "sangatta", lat: 0.5244, lng: 117.5986, label: "Sangatta" },
  { key: "tenggarong", lat: -0.3999, lng: 116.9667, label: "Tenggarong" },
  { key: "embalut", lat: -0.45, lng: 117.05, label: "Embalut" },
  { key: "melak", lat: -0.1667, lng: 115.75, label: "Melak" },
  { key: "barong", lat: -0.2, lng: 115.6, label: "Barong Tongkok" },
  { key: "bharinto", lat: -0.55, lng: 115.1, label: "Bharinto" },
  { key: "trubaindo", lat: -0.17, lng: 115.72, label: "Trubaindo" },
  { key: "jorong", lat: -3.9333, lng: 114.7667, label: "Jorong" },
  { key: "tanjung enim", lat: -3.7667, lng: 103.7667, label: "Tanjung Enim" },
  { key: "tanjungenim", lat: -3.7667, lng: 103.7667, label: "Tanjung Enim" },
  { key: "palembang", lat: -2.9761, lng: 104.7754, label: "Palembang" },
  { key: "berau", lat: 2.16, lng: 117.498, label: "Berau" },
  { key: "banjarmasin", lat: -3.3194, lng: 114.5908, label: "Banjarmasin" },
  { key: "surabaya", lat: -7.2575, lng: 112.7521, label: "Surabaya" },
  { key: "bandung", lat: -6.9175, lng: 107.6191, label: "Bandung" },
  { key: "makassar", lat: -5.1477, lng: 119.4327, label: "Makassar" },
  { key: "pontianak", lat: -0.0263, lng: 109.3425, label: "Pontianak" },
];

function clean(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function coordFor(name: string): { lat: number; lng: number; label: string } | null {
  const n = name.toLowerCase();
  for (const s of SITE_COORDS) {
    if (n.includes(s.key)) return { lat: s.lat, lng: s.lng, label: s.label };
  }
  return null;
}

function isKtd(company: string): boolean {
  const c = company.toLowerCase();
  return c.includes("kitadin") || /\bktd\b/.test(c);
}
const SAMARINDA = SITE_COORDS.find((s) => s.key === "samarinda")!;

/**
 * Resolve a movement endpoint to a mappable site. Prefer the real geographic site
 * when the location names a known city (so a KTD employee in Jakarta maps to Jakarta);
 * otherwise fall back by entity — KTD (Kitadin) records without a city sit at Samarinda.
 */
function resolveSite(location: string, company: string): { lat: number; lng: number; label: string } | null {
  const city = coordFor(location);
  if (city) return city;
  if (isKtd(company)) return { lat: SAMARINDA.lat, lng: SAMARINDA.lng, label: SAMARINDA.label };
  return null;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const STATUS_ORDER = ["Draft", "RequiresReview", "ReadyToGenerate", "Finalized", "Published"];
const STATUS_LABELS: Record<string, string> = {
  Draft: "Draft",
  RequiresReview: "Requires Review",
  ReadyToGenerate: "Ready",
  Finalized: "Finalized",
  Published: "Published",
};

export async function getDashboardAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [announcements, employees] = await Promise.all([
    prisma.announcement.findMany({
      select: {
        id: true,
        movementType: true,
        status: true,
        announcementDate: true,
        createdAt: true,
        creator: { select: { fullName: true, username: true } },
      },
    }),
    prisma.announcementEmployee.findMany({
      select: {
        employeeName: true,
        title: true,
        currentJs: true,
        newJs: true,
        currentCompany: true,
        newCompany: true,
        currentLocation: true,
        newLocation: true,
        currentDepartment: true,
        newDepartment: true,
        currentPosition: true,
        newPosition: true,
        effectiveDate: true,
        announcement: { select: { movementType: true } },
      },
    }),
  ]);

  // ---- KPIs ----
  const transfersCount = announcements.filter((a) => a.movementType === "Transfer").length;
  const assignmentsCount = announcements.filter((a) => a.movementType === "Assignment").length;

  // ---- Flows (Sankey) for each dimension ----
  const flowFor = (pick: (e: (typeof employees)[number]) => [string, string]): FlowLink[] => {
    const map = new Map<string, number>();
    for (const e of employees) {
      const [from, to] = pick(e);
      const s = clean(from);
      const t = clean(to);
      if (!s || !t || s === t) continue;
      const k = `${s}\u0000${t}`;
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()]
      .map(([k, value]) => {
        const [source, target] = k.split("\u0000");
        return { source, target, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 24);
  };

  const flows: Record<FlowDim, FlowLink[]> = {
    company: flowFor((e) => [e.currentCompany ?? "", e.newCompany ?? ""]),
    location: flowFor((e) => [e.currentLocation ?? "", e.newLocation ?? ""]),
    department: flowFor((e) => [e.currentDepartment ?? "", e.newDepartment ?? ""]),
  };

  // ---- Geographic site map (nodes + arcs from location moves) ----
  const nodeAgg = new Map<string, SiteNode>();
  const arcAgg = new Map<string, SiteArc>();
  const touchNode = (label: string, lat: number, lng: number) => {
    if (!nodeAgg.has(label)) {
      nodeAgg.set(label, { name: label, lat, lng, inbound: 0, outbound: 0, total: 0 });
    }
    return nodeAgg.get(label)!;
  };
  for (const e of employees) {
    const from = resolveSite(clean(e.currentLocation), clean(e.currentCompany));
    const to = resolveSite(clean(e.newLocation), clean(e.newCompany));
    if (from) touchNode(from.label, from.lat, from.lng).outbound += 1;
    if (to) touchNode(to.label, to.lat, to.lng).inbound += 1;
    if (from && to && from.label !== to.label) {
      const k = `${from.label}\u0000${to.label}`;
      const existing = arcAgg.get(k);
      if (existing) existing.value += 1;
      else
        arcAgg.set(k, {
          from: from.label,
          to: to.label,
          fromLat: from.lat,
          fromLng: from.lng,
          toLat: to.lat,
          toLng: to.lng,
          value: 1,
        });
    }
  }
  for (const n of nodeAgg.values()) n.total = n.inbound + n.outbound;
  const mapNodes = [...nodeAgg.values()].sort((a, b) => b.total - a.total);
  const mapArcs = [...arcAgg.values()].sort((a, b) => b.value - a.value).slice(0, 30);

  // ---- Movement rates: Transfer vs Assignment (overall + by department) ----
  // Every movement is lateral, so we track the Transfer/Assignment mix, not job-scale.
  let empTransfers = 0;
  let empAssignments = 0;
  const deptMove = new Map<string, { transfers: number; assignments: number }>();
  for (const e of employees) {
    const isAssignment = (e.announcement?.movementType ?? "Transfer") === "Assignment";
    if (isAssignment) empAssignments += 1;
    else empTransfers += 1;
    const dept = clean(e.newDepartment) || clean(e.currentDepartment);
    if (dept) {
      const d = deptMove.get(dept) ?? { transfers: 0, assignments: 0 };
      if (isAssignment) d.assignments += 1;
      else d.transfers += 1;
      deptMove.set(dept, d);
    }
  }
  const empTotal = empTransfers + empAssignments;
  const transferRate = empTotal > 0 ? Math.round((empTransfers / empTotal) * 100) : 0;
  const movementByDept = [...deptMove.entries()]
    .map(([department, v]) => ({ department, transfers: v.transfers, assignments: v.assignments, total: v.transfers + v.assignments }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 7);

  // ---- Trend over last 12 months (Transfer vs Assignment) ----
  const months: { month: string; label: string; transfer: number; assignment: number }[] = [];
  const monthIndex = new Map<string, number>();
  const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = monthKey(d);
    monthIndex.set(key, months.length);
    months.push({ month: key, label: MONTH_ABBR[d.getUTCMonth()], transfer: 0, assignment: 0 });
  }
  for (const a of announcements) {
    const idx = monthIndex.get(monthKey(new Date(a.announcementDate)));
    if (idx === undefined) continue;
    if (a.movementType === "Assignment") months[idx].assignment += 1;
    else months[idx].transfer += 1;
  }

  // ---- Status funnel ----
  const statusCount = new Map<string, number>();
  for (const a of announcements) statusCount.set(a.status, (statusCount.get(a.status) ?? 0) + 1);
  const statusFunnel = STATUS_ORDER.map((s) => ({
    status: s,
    label: STATUS_LABELS[s] ?? s,
    count: statusCount.get(s) ?? 0,
  }));

  // ---- Leaderboards ----
  const rank = (pick: (e: (typeof employees)[number]) => string, take = 7) => {
    const m = new Map<string, number>();
    for (const e of employees) {
      const v = clean(pick(e));
      if (v) m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, take);
  };
  const leaderboards = {
    destinations: rank((e) => e.newLocation ?? ""),
    origins: rank((e) => e.currentLocation ?? ""),
    departments: rank((e) => e.newDepartment ?? e.currentDepartment ?? ""),
  };

  // ---- Activity heatmap (all-time daily counts; the UI windows it by range) ----
  const activity = new Map<string, number>();
  for (const a of announcements) {
    const d = new Date(a.announcementDate);
    if (d <= now) activity.set(dayKey(d), (activity.get(dayKey(d)) ?? 0) + 1);
  }
  const activityDays = [...activity.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ---- Contributors (who entered the data), split by movement type ----
  const contribMap = new Map<string, { name: string; transfers: number; assignments: number }>();
  for (const an of announcements) {
    const name = clean(an.creator?.fullName) || clean(an.creator?.username) || "Unknown";
    const c = contribMap.get(name) ?? { name, transfers: 0, assignments: 0 };
    if (an.movementType === "Assignment") c.assignments += 1;
    else c.transfers += 1;
    contribMap.set(name, c);
  }
  const contributors = [...contribMap.values()]
    .map((c) => ({ ...c, total: c.transfers + c.assignments }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  // ---- Upcoming pipeline (next 30 days) ----
  const upcoming = employees
    .filter((e) => e.effectiveDate && e.effectiveDate >= now && e.effectiveDate <= in30Days)
    .sort((a, b) => a.effectiveDate!.getTime() - b.effectiveDate!.getTime())
    .slice(0, 12)
    .map((e) => ({
      employeeName: clean(e.title) ? `${clean(e.title)} ${e.employeeName}` : e.employeeName,
      movementType: (e.announcement?.movementType ?? "Transfer") as MovementType,
      date: e.effectiveDate,
      from: clean(e.currentLocation) || clean(e.currentPosition) || "—",
      to: clean(e.newLocation) || clean(e.newPosition) || "—",
    }));

  return {
    generatedAt: now.toISOString(),
    kpis: {
      totalAnnouncements: announcements.length,
      employeesMoved: employees.length,
      transferRate,
      transfers: transfersCount,
      assignments: assignmentsCount,
      requiresReview: statusCount.get("RequiresReview") ?? 0,
      readyToGenerate: statusCount.get("ReadyToGenerate") ?? 0,
      finalizedThisMonth: announcements.filter(
        (a) =>
          (a.status === "Finalized" || a.status === "Published") &&
          new Date(a.announcementDate) >= startOfMonth
      ).length,
      upcoming30: upcoming.length,
    },
    movementDistribution: [
      { movementType: "Transfer", count: transfersCount },
      { movementType: "Assignment", count: assignmentsCount },
    ],
    flows,
    map: { nodes: mapNodes, arcs: mapArcs },
    movementRates: { transfers: empTransfers, assignments: empAssignments, total: empTotal, transferRate, byDepartment: movementByDept },
    trend: months,
    statusFunnel,
    leaderboards,
    contributors,
    activity: activityDays,
    upcoming,
  };
}
