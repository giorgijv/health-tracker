// Turns a user's tracked data into a compact, high-signal text block for the
// recommendation model. Kept pure (no DB access) so it can be unit-tested.

export interface RecContextInput {
  goals: string[];
  activityLevel: string | null;
  assessment: {
    type: string;
    date: string;
    overallLevel: string;
    focusAreas: string[];
  } | null;
  weights: { date: string; kg: number }[];
  workouts: { date: string; type: string }[];
  meals: { date: string; calories: number; proteinG: number; quality: string | null }[];
  today: string; // YYYY-MM-DD
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = Date.UTC(ay, am - 1, ad);
  const tb = Date.UTC(by, bm - 1, bd);
  return Math.round((tb - ta) / 86_400_000);
}

function tally(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([k, n]) => `${k} x${n}`)
    .join(", ");
}

export function formatContext(input: RecContextInput): string {
  const sections: string[] = [];

  // Profile
  const profileLines = [
    `Goals: ${input.goals.length ? input.goals.join("; ") : "not set"}`,
    `Activity level: ${input.activityLevel ?? "not set"}`,
  ];
  sections.push(`PROFILE\n${profileLines.join("\n")}`);

  // Assessment
  if (input.assessment) {
    const a = input.assessment;
    sections.push(
      `LATEST ASSESSMENT (${a.type}, ${a.date})\n` +
        `Overall level: ${a.overallLevel}\n` +
        `Focus areas: ${a.focusAreas.length ? a.focusAreas.join("; ") : "none recorded"}`,
    );
  } else {
    sections.push("LATEST ASSESSMENT\nNone completed yet.");
  }

  // Weight
  const weights = [...input.weights].sort((a, b) => a.date.localeCompare(b.date));
  if (weights.length > 0) {
    const first = weights[0];
    const last = weights[weights.length - 1];
    const change = last.kg - first.kg;
    const dir = change < 0 ? "down" : change > 0 ? "up" : "flat";
    sections.push(
      `WEIGHT (${weights.length} entries)\n` +
        `Latest: ${last.kg} kg on ${last.date}\n` +
        `Window: ${first.kg} → ${last.kg} kg (${dir} ${Math.abs(change).toFixed(1)} kg since ${first.date})`,
    );
  } else {
    sections.push("WEIGHT\nNo measurements logged.");
  }

  // Workouts
  if (input.workouts.length > 0) {
    const last7 = input.workouts.filter((w) => daysBetween(w.date, input.today) <= 6).length;
    sections.push(
      `WORKOUTS (last 30 days)\n` +
        `Total: ${input.workouts.length}\n` +
        `Last 7 days: ${last7}\n` +
        `Types: ${tally(input.workouts.map((w) => w.type))}`,
    );
  } else {
    sections.push("WORKOUTS (last 30 days)\nNone logged.");
  }

  // Nutrition — aggregate meals into per-day totals, then average across logged days.
  if (input.meals.length > 0) {
    const byDay = new Map<string, { calories: number; proteinG: number }>();
    for (const m of input.meals) {
      const d = byDay.get(m.date) ?? { calories: 0, proteinG: 0 };
      d.calories += m.calories;
      d.proteinG += m.proteinG;
      byDay.set(m.date, d);
    }
    const days = [...byDay.values()];
    const avgCal = Math.round(days.reduce((s, d) => s + d.calories, 0) / days.length);
    const avgProtein = Math.round(days.reduce((s, d) => s + d.proteinG, 0) / days.length);
    const qualities = input.meals.map((m) => m.quality).filter((q): q is string => q != null);

    sections.push(
      `NUTRITION (last 14 days, ${byDay.size} day(s) logged, ${input.meals.length} meal(s))\n` +
        `Avg calories/day: ~${avgCal}\n` +
        `Avg protein/day: ~${avgProtein} g\n` +
        `Meal quality: ${qualities.length ? tally(qualities) : "not rated"}`,
    );
  } else {
    sections.push("NUTRITION (last 14 days)\nNo meals logged.");
  }

  return sections.join("\n\n");
}
