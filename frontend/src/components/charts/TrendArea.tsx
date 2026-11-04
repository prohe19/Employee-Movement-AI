import { useState } from "react";
import type { DashboardAnalytics } from "../../api/types";
import { FILL, GLOW, INK, LegendChip, Tip, useWidth } from "./common";

/** 12-month stacked area: Transfers vs Assignments, with a crosshair tooltip. */
export function TrendArea({ data }: { data: DashboardAnalytics["trend"] }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<{ i: number; x: number; y: number } | null>(null);
  const H = 220;
  const padL = 30;
  const padR = 10;
  const padB = 22;
  const padT = 12;

  const maxY = Math.max(4, ...data.map((d) => d.transfer + d.assignment));
  const innerW = Math.max(1, width - padL - padR);
  const innerH = H - padT - padB;
  const x = (i: number) => padL + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => padT + innerH - (v / maxY) * innerH;

  const line = (sel: (d: DashboardAnalytics["trend"][number]) => number) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(sel(d))}`).join(" ");
  const topVal = (d: DashboardAnalytics["trend"][number]) => d.transfer + d.assignment;

  const areaTransfer = `${line((d) => d.transfer)} L${x(data.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const areaTop = `${line(topVal)} ${data
    .map((d, i) => `L${x(data.length - 1 - i)},${y(data[data.length - 1 - i].transfer)}`)
    .join(" ")} Z`;

  const gridVals = [0, 0.5, 1].map((f) => Math.round(maxY * f));

  return (
    <div ref={ref} style={{ width: "100%", position: "relative" }}>
      {width > 0 && (
        <svg
          width={width}
          height={H}
          style={{ display: "block" }}
          onMouseMove={(e) => {
            const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const i = Math.max(0, Math.min(data.length - 1, Math.round(((mx - padL) / innerW) * (data.length - 1))));
            setHover({ i, x: e.clientX, y: e.clientY });
          }}
          onMouseLeave={() => setHover(null)}
        >
          <defs>
            <linearGradient id="trTransfer" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={FILL.pink} stopOpacity={0.5} />
              <stop offset="100%" stopColor={FILL.pink} stopOpacity={0.03} />
            </linearGradient>
            <linearGradient id="trAssign" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={FILL.teal} stopOpacity={0.45} />
              <stop offset="100%" stopColor={FILL.teal} stopOpacity={0.03} />
            </linearGradient>
          </defs>

          {/* gridlines + y labels */}
          {gridVals.map((v, k) => (
            <g key={k}>
              <line x1={padL} x2={width - padR} y1={y(v)} y2={y(v)} stroke={INK.grid} strokeWidth={1} />
              <text x={4} y={y(v) + 3} fontSize={9} fontFamily="var(--font-mono)" fill={INK.faint}>
                {v}
              </text>
            </g>
          ))}

          {/* stacked areas (assignment on top of transfer) */}
          <path d={areaTop} fill="url(#trAssign)" />
          <path d={areaTransfer} fill="url(#trTransfer)" />
          <path d={line(topVal)} fill="none" stroke={GLOW.teal} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${GLOW.teal})` }} />
          <path d={line((d) => d.transfer)} fill="none" stroke={GLOW.pink} strokeWidth={2} style={{ filter: `drop-shadow(0 0 4px ${GLOW.pink})` }} />

          {/* x labels */}
          {data.map((d, i) =>
            i % 2 === 0 || width > 420 ? (
              <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize={9} fontFamily="var(--font-mono)" fill={INK.faint}>
                {d.label}
              </text>
            ) : null
          )}

          {/* crosshair */}
          {hover && (
            <g>
              <line x1={x(hover.i)} x2={x(hover.i)} y1={padT} y2={padT + innerH} stroke="rgba(255,214,231,0.4)" strokeWidth={1} strokeDasharray="3 3" />
              <circle cx={x(hover.i)} cy={y(data[hover.i].transfer)} r={3.5} fill={GLOW.pink} />
              <circle cx={x(hover.i)} cy={y(topVal(data[hover.i]))} r={3.5} fill={GLOW.teal} />
            </g>
          )}
        </svg>
      )}

      <div style={{ display: "flex", gap: 16, marginTop: 4 }}>
        <LegendChip color={FILL.pink} glow={GLOW.pink} label="Transfer" />
        <LegendChip color={FILL.teal} glow={GLOW.teal} label="Assignment" />
      </div>

      {hover && (
        <Tip x={hover.x} y={hover.y}>
          <div style={{ color: INK.text, fontWeight: 700 }}>{data[hover.i].month}</div>
          <div style={{ color: GLOW.pink }}>Transfer: {data[hover.i].transfer}</div>
          <div style={{ color: GLOW.teal }}>Assignment: {data[hover.i].assignment}</div>
          <div style={{ color: INK.muted, marginTop: 2 }}>Total: {topVal(data[hover.i])}</div>
        </Tip>
      )}
    </div>
  );
}
