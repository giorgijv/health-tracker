interface Props {
  label: string;
  value: string;
  unit?: string;
  /** Signed change vs. the previous entry. Lower-is-better fields flip the color. */
  delta?: number | null;
  lowerIsBetter?: boolean;
}

export function StatTile({ label, value, unit, delta, lowerIsBetter }: Props) {
  let deltaClass = "flat";
  if (delta != null && delta !== 0) {
    const improving = lowerIsBetter ? delta < 0 : delta > 0;
    deltaClass = improving ? "good" : "bad";
  }

  return (
    <div className="stat-tile">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      {delta != null && (
        <div className={`stat-delta ${deltaClass}`}>
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "•"} {Math.abs(delta).toFixed(1)}
          {unit}
        </div>
      )}
    </div>
  );
}
