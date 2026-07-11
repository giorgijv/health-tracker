import { useState } from "react";
import { useElementWidth } from "../hooks/useElementWidth";
import type { Point } from "../lib/progress";

interface Props {
  data: Point[];
  unit?: string;
  height?: number;
}

const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function LineChart({ data, unit = "", height = 220 }: Props) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="chart-empty">No data yet — log a few entries to see your trend.</div>
    );
  }

  const w = width || 320;
  const innerW = Math.max(1, w - PAD.left - PAD.right);
  const innerH = Math.max(1, height - PAD.top - PAD.bottom);

  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  // A touch of headroom so the line doesn't kiss the edges.
  const yMin = min - range * 0.1;
  const yMax = max + range * 0.1;

  const x = (i: number) =>
    PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(d.value)}`).join(" ");

  // Recessive y gridlines at min, mid, max.
  const yTicks = [yMin + range * 0.1, (yMin + yMax) / 2, yMax - range * 0.1];

  const activePoint = active != null ? data[active] : null;

  return (
    <div className="chart" ref={wrapRef} style={{ position: "relative" }}>
      <svg width={w} height={height} role="img" aria-label={`Line chart of ${unit || "value"} over time`}>
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              x2={w - PAD.right}
              y1={y(t)}
              y2={y(t)}
              className="grid"
            />
            <text x={PAD.left - 6} y={y(t)} className="axis-label" textAnchor="end" dominantBaseline="middle">
              {t.toFixed(range < 5 ? 1 : 0)}
            </text>
          </g>
        ))}

        {/* x labels: first, middle, last */}
        {[0, Math.floor((data.length - 1) / 2), data.length - 1]
          .filter((v, i, a) => a.indexOf(v) === i)
          .map((i) => (
            <text key={i} x={x(i)} y={height - 8} className="axis-label" textAnchor="middle">
              {formatDate(data[i].date)}
            </text>
          ))}

        <path d={linePath} className="line" fill="none" />

        {data.map((d, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(d.value)}
            r={active === i ? 6 : 4}
            className="dot"
          />
        ))}

        {activePoint && (
          <line x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={PAD.top + innerH} className="crosshair" />
        )}

        {/* Transparent hit areas for hover */}
        {data.map((d, i) => {
          const bandW = innerW / Math.max(1, data.length);
          return (
            <rect
              key={i}
              x={x(i) - bandW / 2}
              y={PAD.top}
              width={bandW}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          );
        })}
      </svg>

      {activePoint && (
        <div
          className="tooltip"
          style={{
            left: `${(x(active!) / w) * 100}%`,
            top: `${y(activePoint.value)}px`,
          }}
        >
          <strong>
            {activePoint.value}
            {unit}
          </strong>
          <div>{formatDate(activePoint.date)}</div>
        </div>
      )}
    </div>
  );
}
