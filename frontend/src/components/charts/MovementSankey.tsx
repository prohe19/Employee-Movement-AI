import { useMemo } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import type { FlowLink } from "../../api/types";
import { FILL, GLOW, INK, Tip, useHoverTip, useWidth } from "./common";

/**
 * Movement flow as a bipartite Sankey: origins on the left, destinations on the
 * right. Nodes are split by side (origin "X" vs destination "X") so reciprocal
 * moves never form an illegal cycle, and each ribbon fades pink→teal (origin→dest).
 */

type N = { id: string; label: string; side: "from" | "to"; x0?: number; x1?: number; y0?: number; y1?: number };
type L = { source: string | number | N; target: string | number | N; value: number; raw: FlowLink; width?: number; y0?: number; y1?: number };

const HEIGHT = 360;

export function MovementSankey({ links }: { links: FlowLink[] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { tip, move, hide } = useHoverTip<FlowLink>();

  const graph = useMemo(() => {
    if (!width || links.length === 0) return null;
    const nodeMap = new Map<string, N>();
    const ensure = (name: string, side: "from" | "to") => {
      const id = `${side}:${name}`;
      if (!nodeMap.has(id)) nodeMap.set(id, { id, label: name, side });
      return id;
    };
    const sLinks: L[] = links.map((l) => ({
      source: ensure(l.source, "from"),
      target: ensure(l.target, "to"),
      value: l.value,
      raw: l,
    }));
    const nodes = [...nodeMap.values()];
    try {
      // Reserve horizontal room for the origin/destination labels so they aren't clipped.
      const M = Math.max(44, Math.min(96, Math.round(width * 0.2)));
      const layout = sankey<N, L>()
        .nodeId((d) => d.id)
        .nodeWidth(13)
        .nodePadding(11)
        .extent([
          [M, 6],
          [width - M, HEIGHT - 6],
        ]);
      return layout({ nodes: nodes.map((n) => ({ ...n })), links: sLinks.map((l) => ({ ...l })) });
    } catch {
      return null;
    }
  }, [links, width]);

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      {!graph || links.length === 0 ? (
        <Empty />
      ) : (
        <svg width={width} height={HEIGHT} style={{ display: "block", overflow: "visible" }}>
          <defs>
            <linearGradient id="sankeyRibbon" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={FILL.pink} />
              <stop offset="100%" stopColor={FILL.teal} />
            </linearGradient>
          </defs>
          {/* links */}
          <g fill="none">
            {(graph.links as unknown as (L & { width: number })[]).map((l, i) => {
              const d = sankeyLinkHorizontal()(l as never) ?? undefined;
              const hovered = tip?.data === l.raw;
              return (
                <path
                  key={i}
                  d={d}
                  stroke="url(#sankeyRibbon)"
                  strokeWidth={Math.max(1, l.width)}
                  strokeOpacity={tip ? (hovered ? 0.95 : 0.14) : 0.4}
                  style={{ transition: "stroke-opacity 120ms", cursor: "pointer" }}
                  onMouseMove={(e) => move(e, l.raw)}
                  onMouseLeave={hide}
                />
              );
            })}
          </g>
          {/* nodes */}
          <g>
            {(graph.nodes as unknown as Required<N>[]).map((n) => {
              const h = Math.max(1, n.y1 - n.y0);
              const color = n.side === "from" ? FILL.pink : FILL.teal;
              const glow = n.side === "from" ? GLOW.pink : GLOW.teal;
              const atLeft = n.side === "from";
              return (
                <g key={n.id}>
                  <rect
                    x={n.x0}
                    y={n.y0}
                    width={n.x1 - n.x0}
                    height={h}
                    fill={color}
                    rx={2}
                    style={{ filter: `drop-shadow(0 0 5px ${glow})` }}
                  />
                  {h > 9 && (
                    <text
                      x={atLeft ? n.x0 - 7 : n.x1 + 7}
                      y={n.y0 + h / 2}
                      textAnchor={atLeft ? "end" : "start"}
                      dominantBaseline="middle"
                      fontSize={10.5}
                      fontFamily="var(--font-mono)"
                      fill={INK.text}
                    >
                      {n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      )}
      {tip && (
        <Tip x={tip.x} y={tip.y}>
          <div style={{ color: FILL.pink, fontWeight: 700 }}>{tip.data.source}</div>
          <div style={{ color: INK.muted, fontSize: 10 }}>↓ to</div>
          <div style={{ color: GLOW.teal, fontWeight: 700 }}>{tip.data.target}</div>
          <div style={{ marginTop: 3 }}>
            {tip.data.value} {tip.data.value === 1 ? "move" : "moves"}
          </div>
        </Tip>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div
      style={{
        height: HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: INK.faint,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        textAlign: "center",
      }}
    >
      No movement flows yet — create a few transfers (or load demo data) to see the flow.
    </div>
  );
}
