import type { BodyMetric, Workout } from "@health-tracker/shared";

export interface Point {
  date: string; // YYYY-MM-DD
  value: number;
}

export type MetricField = "weightKg" | "bodyFatPctEst" | "waistCm";

/** Ascending-by-date points for one metric field, skipping entries without it. */
export function metricSeries(metrics: BodyMetric[], field: MetricField): Point[] {
  return metrics
    .filter((m) => m[field] != null)
    .map((m) => ({ date: m.date, value: m[field] as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Ascending-by-date weight points, skipping entries without a weight. */
export function weightSeries(metrics: BodyMetric[]): Point[] {
  return metricSeries(metrics, "weightKg");
}

/** Latest non-null value of a metric field, with the immediately prior value for a delta. */
export function latestWithDelta(
  metrics: BodyMetric[],
  field: "weightKg" | "bodyFatPctEst" | "waistCm",
): { value: number; delta: number | null } | null {
  const points = metrics
    .filter((m) => m[field] != null)
    .map((m) => ({ date: m.date, value: m[field] as number }))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (points.length === 0) return null;
  const value = points[points.length - 1].value;
  const delta = points.length >= 2 ? value - points[points.length - 2].value : null;
  return { value, delta };
}

function startOfWeek(d: Date): Date {
  // Monday-based week start, normalized to local midnight.
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (copy.getDay() + 6) % 7; // 0 = Monday
  copy.setDate(copy.getDate() - day);
  return copy;
}

function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export interface WeekBucket {
  weekStart: string; // YYYY-MM-DD (Monday)
  label: string; // e.g. "Mar 3"
  count: number;
}

/**
 * Count of workouts per week for the last `weeks` weeks, oldest first.
 * Pass `type` to count only workouts matching that type (case-insensitive) —
 * used for per-goal weekly progress.
 */
export function weeklyWorkoutCounts(
  workouts: Workout[],
  weeks = 8,
  now: Date = new Date(),
  type?: string,
): WeekBucket[] {
  const thisWeekStart = startOfWeek(now);
  const buckets: WeekBucket[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    buckets.push({
      weekStart: ymd(start),
      label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count: 0,
    });
  }

  const byWeek = new Map(buckets.map((b) => [b.weekStart, b]));
  const typeLower = type?.toLowerCase();
  for (const w of workouts) {
    if (typeLower != null && w.type.toLowerCase() !== typeLower) continue;
    // Parse the date as local midnight to keep week bucketing stable.
    const [y, m, d] = w.date.split("-").map(Number);
    if (!y || !m || !d) continue;
    const key = ymd(startOfWeek(new Date(y, m - 1, d)));
    const bucket = byWeek.get(key);
    if (bucket) bucket.count += 1;
  }

  return buckets;
}

/** This week's count for a specific workout type, and the % of `target` it represents (0-100+). */
export function weeklyGoalProgress(
  workouts: Workout[],
  type: string,
  target: number,
  now: Date = new Date(),
): { count: number; target: number; pct: number } {
  const [current] = weeklyWorkoutCounts(workouts, 1, now, type);
  const count = current?.count ?? 0;
  const pct = target > 0 ? Math.round((count / target) * 100) : 0;
  return { count, target, pct };
}

/** Count of workouts in the last `days` days (inclusive of today). */
export function workoutsInLastDays(
  workouts: Workout[],
  days: number,
  now: Date = new Date(),
): number {
  const cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  cutoff.setDate(cutoff.getDate() - (days - 1));
  const cutoffStr = ymd(cutoff);
  const todayStr = ymd(now);
  return workouts.filter((w) => w.date >= cutoffStr && w.date <= todayStr).length;
}
