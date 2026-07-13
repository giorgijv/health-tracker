interface Props {
  /** 0..1 progress around the ring (clamped). */
  fraction: number;
  /** Big number shown in the middle. */
  value: string;
  /** Small line under the value, inside the ring. */
  caption: string;
  size?: number;
  /** CSS custom property carrying the ring color, e.g. "--series-2". */
  colorVar?: string;
}

export function ActivityRing({ fraction, value, caption, size = 132, colorVar = "--series-2" }: Props) {
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const frac = Math.min(1, Math.max(0, fraction));

  return (
    <div className="activity-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${caption}: ${value}`}>
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`var(${colorVar})`}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-value">{value}</span>
        <span className="ring-caption">{caption}</span>
      </div>
    </div>
  );
}
