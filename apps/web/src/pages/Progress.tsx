import type { BodyMetric, Workout } from "@health-tracker/shared";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BarChart } from "../components/BarChart";
import { LineChart } from "../components/LineChart";
import { StatTile } from "../components/StatTile";
import { apiFetch } from "../lib/api";
import {
  latestWithDelta,
  metricSeries,
  weeklyWorkoutCounts,
  weightSeries,
  workoutsInLastDays,
} from "../lib/progress";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function numOrNull(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export function ProgressPage() {
  const [metrics, setMetrics] = useState<BodyMetric[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // metric form
  const [mDate, setMDate] = useState(today());
  const [mWeight, setMWeight] = useState("");
  const [mBodyFat, setMBodyFat] = useState("");
  const [mWaist, setMWaist] = useState("");

  // workout form
  const [wDate, setWDate] = useState(today());
  const [wType, setWType] = useState("");
  const [wCount, setWCount] = useState("");
  const [wDuration, setWDuration] = useState("");
  const [wNotes, setWNotes] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [m, w] = await Promise.all([
        apiFetch<BodyMetric[]>("/api/metrics"),
        apiFetch<Workout[]>("/api/workouts"),
      ]);
      setMetrics(m);
      setWorkouts(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addMetric(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/metrics", {
        method: "POST",
        body: JSON.stringify({
          date: mDate,
          weightKg: numOrNull(mWeight),
          bodyFatPctEst: numOrNull(mBodyFat),
          waistCm: numOrNull(mWaist),
        }),
      });
      setMWeight("");
      setMBodyFat("");
      setMWaist("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  async function addWorkout(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const count = numOrNull(wCount);
      await apiFetch("/api/workouts", {
        method: "POST",
        body: JSON.stringify({
          date: wDate,
          type: wType,
          ...(count != null && { count }),
          durationMin: numOrNull(wDuration),
          notes: wNotes.trim() || null,
        }),
      });
      setWType("");
      setWCount("");
      setWDuration("");
      setWNotes("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  const weight = latestWithDelta(metrics, "weightKg");
  const bodyFat = latestWithDelta(metrics, "bodyFatPctEst");
  const waist = latestWithDelta(metrics, "waistCm");
  const bodyFatTrend = metricSeries(metrics, "bodyFatPctEst");
  const waistTrend = metricSeries(metrics, "waistCm");
  const weekBuckets = weeklyWorkoutCounts(workouts, 8);
  const thisWeek = workoutsInLastDays(workouts, 7);
  const thisMonth = workoutsInLastDays(workouts, 30);

  return (
    <div className="progress viz-root">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Progress</h1>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            {weight && (
              <StatTile label="Weight" value={weight.value.toString()} unit=" kg" delta={weight.delta} lowerIsBetter />
            )}
            {bodyFat && (
              <StatTile label="Body fat" value={bodyFat.value.toString()} unit=" %" delta={bodyFat.delta} lowerIsBetter />
            )}
            {waist && (
              <StatTile label="Waist" value={waist.value.toString()} unit=" cm" delta={waist.delta} lowerIsBetter />
            )}
            <StatTile label="Workouts this week" value={thisWeek.toString()} />
            <StatTile label="Workouts (30 days)" value={thisMonth.toString()} />
          </div>

          <section>
            <h2>
              <span className="series-dot" style={{ background: "var(--series-1)" }} />
              Weight trend
            </h2>
            <LineChart data={weightSeries(metrics)} unit=" kg" colorVar="--series-1" />
          </section>

          <section>
            <h2>
              <span className="series-dot" style={{ background: "var(--series-2)" }} />
              Workouts per week
            </h2>
            <BarChart data={weekBuckets.map((b) => ({ label: b.label, value: b.count }))} />
          </section>

          {bodyFatTrend.length > 0 && (
            <section>
              <h2>
                <span className="series-dot" style={{ background: "var(--series-3)" }} />
                Body fat trend
              </h2>
              <LineChart data={bodyFatTrend} unit=" %" colorVar="--series-3" />
            </section>
          )}

          {waistTrend.length > 0 && (
            <section>
              <h2>
                <span className="series-dot" style={{ background: "var(--series-4)" }} />
                Waist trend
              </h2>
              <LineChart data={waistTrend} unit=" cm" colorVar="--series-4" />
            </section>
          )}
        </>
      )}

      <div className="log-forms">
        <form onSubmit={addMetric} className="log-form">
          <h3>Log a measurement</h3>
          <label>
            Date
            <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} required />
          </label>
          <div className="row">
            <label>
              Weight (kg)
              <input type="number" step="0.1" value={mWeight} onChange={(e) => setMWeight(e.target.value)} />
            </label>
            <label>
              Body fat (%)
              <input type="number" step="0.1" value={mBodyFat} onChange={(e) => setMBodyFat(e.target.value)} />
            </label>
            <label>
              Waist (cm)
              <input type="number" step="0.1" value={mWaist} onChange={(e) => setMWaist(e.target.value)} />
            </label>
          </div>
          <button type="submit">Save measurement</button>
        </form>

        <form onSubmit={addWorkout} className="log-form">
          <h3>Log a workout</h3>
          <label>
            Date
            <input type="date" value={wDate} onChange={(e) => setWDate(e.target.value)} required />
          </label>
          <div className="row">
            <label>
              Type
              <input
                type="text"
                value={wType}
                onChange={(e) => setWType(e.target.value)}
                placeholder="Run, Lift, Yoga…"
                required
              />
            </label>
            <label>
              Duration (min)
              <input type="number" value={wDuration} onChange={(e) => setWDuration(e.target.value)} />
            </label>
          </div>
          <label>
            Count (optional — e.g. 10 push-ups)
            <input
              type="number"
              min={1}
              placeholder="1"
              value={wCount}
              onChange={(e) => setWCount(e.target.value)}
            />
          </label>
          <label>
            Notes
            <input type="text" value={wNotes} onChange={(e) => setWNotes(e.target.value)} />
          </label>
          <button type="submit">Save workout</button>
        </form>
      </div>

      {workouts.length > 0 && (
        <section>
          <h2>Recent workouts</h2>
          <ul className="workout-list">
            {workouts.slice(0, 10).map((w) => (
              <li key={w.id}>
                <span className="w-date">{w.date}</span>
                <span className="w-type">
                  {w.type}
                  {w.count > 1 && ` ×${w.count}`}
                </span>
                {w.durationMin != null && <span className="w-dur">{w.durationMin} min</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
