import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { StatusPill } from "../components/ui";
import { announcementsApi } from "../api/endpoints";
import type { Announcement, Paginated } from "../api/types";
import { formatUiDate, MOVEMENT_TYPE_LABELS, MOVEMENT_TYPES } from "../lib/format";

const STATUSES = ["Draft", "RequiresReview", "ReadyToGenerate", "Finalized", "Published", "Cancelled"];
const PAGE_SIZE = 10;

export function RecordsPage() {
  const [data, setData] = useState<Paginated<Announcement> | null>(null);
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (a: Announcement) => {
    const label = a.employees[0]?.employeeName ? ` (${a.employees[0].employeeName})` : "";
    if (
      !window.confirm(
        `Delete announcement ${a.number}${label}?\n\nThis permanently removes it and its employee entries. This cannot be undone.`
      )
    )
      return;
    setDeletingId(a.id);
    setError(null);
    try {
      await announcementsApi.remove(a.id);
      setData((d) =>
        d ? { ...d, total: Math.max(0, d.total - 1), items: d.items.filter((x) => x.id !== a.id) } : d
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete announcement");
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      announcementsApi
        .list({ search, movementType, status, page, pageSize: PAGE_SIZE })
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, movementType, status, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AppShell
      eyebrow="// ARCHIVE"
      title="Announcement Records"
      actions={
        <Link to="/create" className="btn" style={{ textDecoration: "none" }}>
          + NEW
        </Link>
      }
    >
      {/* filters */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 20, fontFamily: "var(--font-mono)", flexWrap: "wrap" }}>
        <input
          className="input"
          style={{ flex: 1, maxWidth: 340, minHeight: 40 }}
          placeholder="Search number, employee, ID…"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="select"
          style={{ width: "auto", minHeight: 40, appearance: "none", cursor: "pointer" }}
          value={movementType}
          onChange={(e) => {
            setPage(1);
            setMovementType(e.target.value);
          }}
        >
          <option value="" style={{ background: "#170722" }}>ALL MOVEMENTS</option>
          {MOVEMENT_TYPES.map((mt) => (
            <option key={mt} value={mt} style={{ background: "#170722" }}>
              {MOVEMENT_TYPE_LABELS[mt]}
            </option>
          ))}
        </select>
        <select
          className="select"
          style={{ width: "auto", minHeight: 40, appearance: "none", cursor: "pointer" }}
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="" style={{ background: "#170722" }}>ALL STATUSES</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} style={{ background: "#170722" }}>
              {s}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "rgba(255,150,190,0.4)" }}>
          {data?.total ?? 0} records
        </span>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 16 }}>{error}</div>}

      {/* table */}
      <div style={{ marginTop: 16, border: "1px solid rgba(177,74,237,0.22)", overflow: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.5fr 1.3fr 1.2fr 1fr 0.5fr 1.1fr 0.9fr 1fr 1.1fr 0.7fr",
            minWidth: 1160,
            padding: "12px 16px",
            background: "rgba(177,74,237,0.08)",
            borderBottom: "1px solid rgba(255,42,109,0.28)",
            fontFamily: "var(--font-mono)",
            fontSize: 9.5,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: "rgba(177,74,237,0.9)",
          }}
        >
          <span>NUMBER</span>
          <span>EMPLOYEE</span>
          <span>MOVEMENT</span>
          <span>NEW POSITION</span>
          <span>JS</span>
          <span>COMPANY</span>
          <span>EFFECTIVE</span>
          <span>SIGNATORY</span>
          <span>STATUS</span>
          <span style={{ textAlign: "right" }}>ACTIONS</span>
        </div>
        {loading && <div style={{ padding: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>Loading…</div>}
        {!loading && data?.items.length === 0 && (
          <div style={{ padding: 20, fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,150,190,0.5)" }}>No records match your filters.</div>
        )}
        {data?.items.map((a) => {
          const emp = a.employees[0];
          return (
            <div
              key={a.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1.5fr 1.3fr 1.2fr 1fr 0.5fr 1.1fr 0.9fr 1fr 1.1fr 0.7fr",
                minWidth: 1160,
                alignItems: "center",
                padding: "13px 16px",
                borderBottom: "1px solid rgba(177,74,237,0.1)",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
              }}
            >
              <span style={{ fontWeight: 700, color: "rgba(255,150,190,0.85)" }}>{a.number}</span>
              <span style={{ color: "var(--text)" }}>
                {emp?.employeeName ?? "—"}
                <br />
                <span style={{ fontSize: 9.5, color: "rgba(255,150,190,0.4)" }}>{emp?.employeeId ?? ""}</span>
              </span>
              <span style={{ color: "rgba(255,150,190,0.6)" }}>{MOVEMENT_TYPE_LABELS[a.movementType]}</span>
              <span style={{ color: "rgba(255,150,190,0.6)" }}>{emp?.newPosition ?? "—"}</span>
              <span style={{ color: "rgba(255,150,190,0.7)" }}>{emp?.currentJs ?? "—"}</span>
              <span style={{ color: "rgba(255,150,190,0.6)", fontSize: 10.5 }}>{emp?.newCompany ?? "—"}</span>
              <span style={{ color: "rgba(255,150,190,0.6)", fontSize: 10.5 }}>{formatUiDate(emp?.effectiveDate)}</span>
              <span style={{ color: "rgba(255,150,190,0.6)", fontSize: 10.5 }}>{a.signatory?.name ?? "—"}</span>
              <span>
                {a.pdfUrl ? (
                  <a href={a.pdfUrl} target="_blank" rel="noreferrer" title="Open PDF">
                    <StatusPill status={a.status} />
                  </a>
                ) : (
                  <StatusPill status={a.status} />
                )}
              </span>
              <span style={{ textAlign: "right" }}>
                <button
                  onClick={() => handleDelete(a)}
                  disabled={deletingId === a.id}
                  title="Delete announcement"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(248,113,113,0.4)",
                    color: "#f87171",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    padding: "5px 10px",
                    cursor: deletingId === a.id ? "default" : "pointer",
                    opacity: deletingId === a.id ? 0.5 : 1,
                  }}
                >
                  {deletingId === a.id ? "…" : "DELETE"}
                </button>
              </span>
            </div>
          );
        })}
      </div>

      {/* pagination */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(255,150,190,0.5)" }}>
        <span>
          Page {data?.page ?? 1} of {totalPages}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-ghost" style={{ height: 30 }} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ‹ PREV
          </button>
          <button className="btn-ghost" style={{ height: 30 }} disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            NEXT ›
          </button>
        </div>
      </div>
    </AppShell>
  );
}
