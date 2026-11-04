import { useMemo } from "react";
import type { MapArc, MapNode } from "../../api/types";
import { FILL, GLOW, INK, Tip, useHoverTip, useWidth } from "./common";

/**
 * Schematic operations map: ITM group sites projected over Indonesia's lat/long
 * (equirectangular) with glowing nodes sized by movement volume and curved,
 * animated arcs for site→site transfers. Not a literal coastline — a site network.
 */

type Hover =
  | { kind: "node"; node: MapNode }
  | { kind: "arc"; arc: MapArc };

export function OperationsMap({ nodes, arcs }: { nodes: MapNode[]; arcs: MapArc[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { tip, move, hide } = useHoverTip<Hover>();
  const height = Math.max(260, Math.min(440, width / 2.1));
  const padX = 58;
  const padY = 34;

  // Fit the projection to the actual site bounds (data-adaptive) so clusters spread
  // out and fill the panel, rather than piling up on an all-Indonesia map.
  const bounds = useMemo(() => {
    if (nodes.length === 0) return { minLat: -6, maxLat: 2, minLng: 103, maxLng: 118 };
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);
    const latSpan = Math.max(1.2, maxLat - minLat);
    const lngSpan = Math.max(1.2, maxLng - minLng);
    minLat -= latSpan * 0.22;
    maxLat += latSpan * 0.22;
    minLng -= lngSpan * 0.18;
    maxLng += lngSpan * 0.18;
    return { minLat, maxLat, minLng, maxLng };
  }, [nodes]);

  const project = useMemo(() => {
    const { minLat, maxLat, minLng, maxLng } = bounds;
    return (lat: number, lng: number) => {
      const x = padX + ((lng - minLng) / (maxLng - minLng)) * (width - padX * 2);
      const y = padY + ((maxLat - lat) / (maxLat - minLat)) * (height - padY * 2);
      return { x, y };
    };
  }, [width, height, bounds]);
  const showEquator = bounds.minLat < 0 && bounds.maxLat > 0;

  const maxTotal = Math.max(1, ...nodes.map((n) => n.total));
  const maxArc = Math.max(1, ...arcs.map((a) => a.value));
  const r = (total: number) => 4 + Math.sqrt(total / maxTotal) * 15;

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      <style>{`@keyframes mapflow { to { stroke-dashoffset: -24; } }`}</style>
      {!width ? null : nodes.length === 0 ? (
        <Empty height={height} />
      ) : (
        <svg width={width} height={height} style={{ display: "block" }}>
          <defs>
            <radialGradient id="mapOcean" cx="50%" cy="38%" r="80%">
              <stop offset="0%" stopColor="rgba(177,74,237,0.10)" />
              <stop offset="100%" stopColor="rgba(10,4,16,0)" />
            </radialGradient>
            <linearGradient id="arcGrad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={FILL.pink} />
              <stop offset="100%" stopColor={GLOW.teal} />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={width} height={height} fill="url(#mapOcean)" />

          {/* lat/long grid */}
          <g stroke={INK.grid} strokeWidth={1}>
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <line key={`v${f}`} x1={padX + f * (width - padX * 2)} y1={padY} x2={padX + f * (width - padX * 2)} y2={height - padY} />
            ))}
            {[0, 0.33, 0.66, 1].map((f) => (
              <line key={`h${f}`} x1={padX} y1={padY + f * (height - padY * 2)} x2={width - padX} y2={padY + f * (height - padY * 2)} />
            ))}
          </g>
          {/* equator marker (only when 0° latitude is in view) */}
          {showEquator &&
            (() => {
              const eqY = project(0, bounds.minLng).y;
              return (
                <g>
                  <line x1={padX} y1={eqY} x2={width - padX} y2={eqY} stroke="rgba(63,224,208,0.25)" strokeWidth={1} strokeDasharray="2 5" />
                  <text x={padX + 2} y={eqY - 4} fontSize={8.5} fontFamily="var(--font-mono)" fill="rgba(63,224,208,0.5)">
                    EQUATOR
                  </text>
                </g>
              );
            })()}

          {/* arcs */}
          <g fill="none">
            {arcs.map((a, i) => {
              const s = project(a.fromLat, a.fromLng);
              const t = project(a.toLat, a.toLng);
              const mx = (s.x + t.x) / 2;
              const my = (s.y + t.y) / 2;
              const dx = t.x - s.x;
              const dy = t.y - s.y;
              const len = Math.hypot(dx, dy) || 1;
              const lift = Math.min(70, len * 0.28);
              const cx = mx - (dy / len) * lift;
              const cy = my - (dx / len) * lift * -1 - lift * 0.4;
              const d = `M${s.x},${s.y} Q${cx},${cy} ${t.x},${t.y}`;
              const hovered = tip?.data.kind === "arc" && tip.data.arc === a;
              const w = 0.8 + (a.value / maxArc) * 3;
              return (
                <g key={i}>
                  <path d={d} stroke="url(#arcGrad)" strokeWidth={w} strokeOpacity={tip ? (hovered ? 0.95 : 0.12) : 0.5} style={{ transition: "stroke-opacity 120ms" }} />
                  <path
                    d={d}
                    stroke={GLOW.teal}
                    strokeWidth={w}
                    strokeOpacity={hovered ? 0 : 0.8}
                    strokeDasharray="2 10"
                    style={{ animation: "mapflow 1.1s linear infinite" }}
                  />
                  <path d={d} stroke="transparent" strokeWidth={Math.max(10, w + 8)} onMouseMove={(e) => move(e, { kind: "arc", arc: a })} onMouseLeave={hide} style={{ cursor: "pointer" }} />
                </g>
              );
            })}
          </g>

          {/* nodes */}
          <g>
            {nodes.map((n, i) => {
              const p = project(n.lat, n.lng);
              const rad = r(n.total);
              const net = n.inbound - n.outbound;
              const color = net >= 0 ? FILL.teal : FILL.pink;
              const glow = net >= 0 ? GLOW.teal : GLOW.pink;
              const hovered = tip?.data.kind === "node" && tip.data.node === n;
              // Stagger labels above/below to reduce collisions in dense clusters.
              const below = i % 2 === 1;
              const ly = below ? p.y + rad + 11 : p.y - rad - 6;
              return (
                <g key={n.name} onMouseMove={(e) => move(e, { kind: "node", node: n })} onMouseLeave={hide} style={{ cursor: "pointer" }}>
                  <circle cx={p.x} cy={p.y} r={rad + 6} fill={glow} opacity={hovered ? 0.3 : 0.14} />
                  <circle cx={p.x} cy={p.y} r={rad} fill={color} stroke={glow} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 6px ${glow})` }} />
                  <text
                    x={p.x}
                    y={ly}
                    textAnchor="middle"
                    fontSize={9.5}
                    fontFamily="var(--font-mono)"
                    fontWeight={700}
                    fill={INK.text}
                    stroke="#0a0410"
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ strokeLinejoin: "round" }}
                  >
                    {n.name}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      )}

      {/* legend */}
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
              <div style={{ color: INK.text, fontWeight: 700 }}>
                {tip.data.arc.from} → {tip.data.arc.to}
              </div>
              <div style={{ marginTop: 2 }}>
                {tip.data.arc.value} {tip.data.arc.value === 1 ? "transfer" : "transfers"}
              </div>
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
