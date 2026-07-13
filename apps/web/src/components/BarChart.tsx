import { useState } from "react";
import { useElementWidth } from "../hooks/useElementWidth";

export interface Bar {
  label: string;
  value: number;
}

interface Props {
  data: Bar[];
  height?: number;
  ariaLabel?: string;
  emptyMessage?: string;
  /** CSS custom property carrying the bar color, e.g. "--series-1". */
  colorVar?: string;
}

const PAD = { top: 16, right: 8, bottom: 24, left: 8 };
const GAP = 2; // 2px surface gap between adjacent bars

export function BarChart({
  data,
  height = 180,
  ariaLabel = "Workouts per week",
  emptyMessage = "No workouts logged yet.",
  colorVar = "--series-2",
}: Props) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="chart-empty">{emptyMessage}</div>;
  }

  const w = width || 320;
  const innerW = Math.max(1, w - PAD.left - PAD.right);
  const innerH = Math.max(1, height - PAD.top - PAD.bottom);
  const max = Math.max(1, ...data.map((d) => d.value));
  const slot = innerW / data.length;
  const barW = Math.max(2, slot - GAP);
  const color = `var(${colorVar})`;

  return (
    <div className="chart bars" ref={wrapRef} style={{ position: "relative" }}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel}>
        {data.map((d, i) => {
          const bh = (d.value / max) * innerH;
          const bx = PAD.left + i * slot + (slot - barW) / 2;
          const by = PAD.top + innerH - bh;
          return (
            <g
              key={i}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {/* full-height hit target */}
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              {d.value > 0 && (
                <rect
                  x={bx}
                  y={by}
                  width={barW}
                  height={bh}
                  rx={4}
                  className={active === i ? "bar active" : "bar"}
                  style={{ fill: color }}
                />
              )}
              {/* direct value label (relief rule: color is never the sole carrier) */}
              {d.value > 0 && (
                <text x={bx + barW / 2} y={by - 4} className="bar-label" textAnchor="middle">
                  {d.value}
                </text>
              )}
              <text x={PAD.left + i * slot + slot / 2} y={height - 8} className="axis-label" textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
