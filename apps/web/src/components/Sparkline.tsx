import { useId } from "react";
import type { Point } from "../lib/progress";
import { smoothPath } from "../lib/chartPath";

interface Props {
  data: Point[];
  /** CSS custom property carrying the line color. */
  colorVar?: string;
  width?: number;
  height?: number;
}

/** Tiny axis-free trend line for hero cards. Decorative — the card shows the
 * real number; the tooltip-equipped chart lives on the Progress page. */
export function Sparkline({ data, colorVar = "--series-1", width = 140, height = 40 }: Props) {
  const gradId = useId().replace(/:/g, "");
  if (data.length < 2) return null;

  const pad = 3;
  const values = data.map((d) => d.value);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }

  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (1 - (d.value - min) / (max - min)) * (height - pad * 2),
  }));

  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

  return (
    <svg
      className="sparkline"
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: `var(${colorVar})` }} stopOpacity={0.3} />
          <stop offset="100%" style={{ stopColor: `var(${colorVar})` }} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={`var(${colorVar})`}
        strokeWidth={2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
