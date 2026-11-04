import { useMemo } from "react";
import { geoMercator, geoPath, geoGraticule10 } from "d3-geo";
import type { MapArc, MapNode } from "../../api/types";
import indonesiaGeo from "../../assets/indonesia.geo.json";
import { FILL, GLOW, INK, Tip, useHoverTip, useWidth } from "./common";

/**
 * Operations map over the real Indonesia coastline (d3-geo Mercator). The projection
 * is fit to the bounding region of the actual sites (with margin) so the coastlines
 * are visible and the sites stay spread out, rather than tiny on an all-Indonesia map.
 * Nodes are sized by volume and colored by net in/outflow; arcs animate transfers.
 */

const INDONESIA = indonesiaGeo as unknown as GeoJSON.Feature;

type Hover = { kind: "node"; node: MapNode } | { kind: "arc"; arc: MapArc };

export function OperationsMap({ nodes, arcs }: { nodes: MapNode[]; arcs: MapArc[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { tip, move, hide } = useHoverTip<Hover>();
  const height = Math.max(300, Math.min(540, width * 0.6));

  const projection = useMemo(() => {
    if (!width) return null;
    const proj = geoMercator();
    // Fit to the sites as a MultiPoint (no polygon-winding ambiguity), inset so the
    // outermost sites sit away from the edges and the surrounding coastline shows.
    const inset = Math.min(width, height) * 0.2;
    if (nodes.length >= 2) {
      const pts = { type: "MultiPoint", coordinates: nodes.map((n) => [n.lng, n.lat]) } as unknown as GeoJSON.Geometry;
      proj.fitExtent(
        [
          [inset, inset],
          [width - inset, height - inset],
        ],
        pts
      );
    } else if (nodes.length === 1) {
      proj.center([nodes[0].lng, nodes[0].lat]).scale(2200).translate([width / 2, height / 2]);
    } else {
      // No sites: frame the Java–Kalimantan window.
      proj.center([112, -2]).scale(Math.max(700, width * 1.6)).translate([width / 2, height / 2]);
    }
    return proj;
  }, [width, height, nodes]);

  const landPath = useMemo(() => (projection ? geoPath(projection)(INDONESIA) ?? "" : ""), [projection]);
  const gratPath = useMemo(() => (projection ? geoPath(projection)(geoGraticule10()) ?? "" : ""), [projection]);

  const maxTotal = Math.max(1, ...nodes.map((n) => n.total));
  const maxArc = Math.max(1, ...arcs.map((a) => a.value));
  const r = (total: number) => 4 + Math.sqrt(total / maxTotal) * 12;
  const pt = (lat: number, lng: number) => (projection ? projection([lng, lat]) : null);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative", overflow: "hidden" }}>
      <style>{`@keyframes mapflow { to { stroke-dashoffset: -24; } }`}</style>
      {!projection ? null : nodes.length === 0 ? (
        <Empty height={height} />
      ) : (
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            <radialGradient id="mapOcean" cx="50%" cy="42%" r="75%">
              <stop offset="0%" stopColor="rgba(60,20,90,0.35)" />
              <stop offset="100%" stopColor="rgba(10,4,16,0)" />
            </radialGradient>
            <linearGradient id="island" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(177,74,237,0.28)" />
              <stop offset="100%" stopColor="rgba(80,30,130,0.16)" />
            </linearGradient>
            <linearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={FILL.pink} />
              <stop offset="100%" stopColor={GLOW.teal} />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="url(#mapOcean)" />
          <path d={gratPath} fill="none" stroke="rgba(177,74,237,0.1)" strokeWidth={0.6} />
          <path d={landPath} fill="url(#island)" stroke={GLOW.purple} strokeWidth={0.9} strokeOpacity={0.7} style={{ filter: "drop-shadow(0 0 6px rgba(201,139,255,0.35))" }} />

          {/* arcs */}
          <g fill="none">
            {arcs.map((a, i) => {
              const s = pt(a.fromLat, a.fromLng);
              const t = pt(a.toLat, a.toLng);
              if (!s || !t) return null;
              const dx = t[0] - s[0], dy = t[1] - s[1];
              const len = Math.hypot(dx, dy) || 1;
              const lift = Math.min(90, len * 0.3);
              const cx = (s[0] + t[0]) / 2 - (dy / len) * lift;
              const cy = (s[1] + t[1]) / 2 + (dx / len) * lift;
              const d = `M${s[0]},${s[1]} Q${cx},${cy} ${t[0]},${t[1]}`;
              const hovered = tip?.data.kind === "arc" && tip.data.arc === a;
              const w = 0.8 + (a.value / maxArc) * 3;
              return (
                <g key={i}>
                  <path d={d} stroke="url(#arcGrad)" strokeWidth={w} strokeOpacity={tip ? (hovered ? 0.95 : 0.12) : 0.55} style={{ transition: "stroke-opacity 120ms" }} />
                  <path d={d} stroke={GLOW.teal} strokeWidth={w} strokeOpacity={hovered ? 0 : 0.8} strokeDasharray="2 10" style={{ animation: "mapflow 1.1s linear infinite" }} />
                  <path d={d} stroke="transparent" strokeWidth={Math.max(10, w + 8)} onMouseMove={(e) => move(e, { kind: "arc", arc: a })} onMouseLeave={hide} style={{ cursor: "pointer" }} />
                </g>
              );
            })}
          </g>

          {/* node circles (drawn first) */}
          <g>
            {nodes.map((n) => {
              const p = pt(n.lat, n.lng);
              if (!p) return null;
              const rad = r(n.total);
              const net = n.inbound - n.outbound;
              const color = net >= 0 ? FILL.teal : FILL.pink;
              const glow = net >= 0 ? GLOW.teal : GLOW.pink;
              const hovered = tip?.data.kind === "node" && tip.data.node === n;
              return (
                <g key={n.name} onMouseMove={(e) => move(e, { kind: "node", node: n })} onMouseLeave={hide} style={{ cursor: "pointer" }}>
                  <circle cx={p[0]} cy={p[1]} r={rad + 5} fill={glow} opacity={hovered ? 0.3 : 0.14} />
                  <circle cx={p[0]} cy={p[1]} r={rad} fill={color} stroke={glow} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
                </g>
              );
            })}
          </g>
          {/* node labels (drawn on top so adjacent circles never cover them) */}
          <g style={{ pointerEvents: "none" }}>
            {nodes.map((n, i) => {
              const p = pt(n.lat, n.lng);
              if (!p) return null;
              const rad = r(n.total);
              const below = i % 2 === 1;
              const ly = below ? p[1] + rad + 11 : p[1] - rad - 6;
              return (
                <text key={n.name} x={p[0]} y={ly} textAnchor="middle" fontSize={9.5} fontFamily="var(--font-mono)" fontWeight={700} fill={INK.text} stroke="#0a0410" strokeWidth={3} paintOrder="stroke" style={{ strokeLinejoin: "round" }}>
                  {n.name}
                </text>
              );
            })}
          </g>
        </svg>
      )}

      {nodes.length > 0 && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 10, color: INK.muted }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FILL.teal, boxShadow: `0 0 7px ${GLOW.teal}` }} /> net inflow (gaining)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: FILL.pink, boxShadow: `0 0 7px ${GLOW.pink}` }} /> net outflow (losing)
          </span>
          <span>● size = total movements</span>
        </div>
      )}

      {tip && (
        <Tip x={tip.x} y={tip.y}>
          {tip.data.kind === "node" ? (
            <>
              <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.node.name}</div>
              <div style={{ color: GLOW.teal }}>↙ in: {tip.data.node.inbound}</div>
              <div style={{ color: GLOW.pink }}>↗ out: {tip.data.node.outbound}</div>
              <div style={{ color: INK.muted, marginTop: 2 }}>net {tip.data.node.inbound - tip.data.node.outbound >= 0 ? "+" : ""}{tip.data.node.inbound - tip.data.node.outbound}</div>
            </>
          ) : (
            <>
              <div style={{ color: INK.text, fontWeight: 700 }}>{tip.data.arc.from} → {tip.data.arc.to}</div>
              <div style={{ marginTop: 2 }}>{tip.data.arc.value} {tip.data.arc.value === 1 ? "transfer" : "transfers"}</div>
            </>
          )}
        </Tip>
      )}
    </div>
  );
}

function Empty({ height }: { height: number }) {
  return (
    <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: INK.faint, fontFamily: "var(--font-mono)", fontSize: 12, textAlign: "center" }}>
      No site movements mapped yet — transfers between known sites will appear here.
    </div>
  );
}
