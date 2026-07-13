import type { Workout, WorkoutGoal } from "@health-tracker/shared";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ActivityRing } from "../components/ActivityRing";
import { BarChart } from "../components/BarChart";
import { apiFetch } from "../lib/api";
import { weeklyGoalProgress, weeklyGoalTotals } from "../lib/progress";

// Fixed order, cycled if there are more goals than colors — never reassigned
// by value/rank (identity stays with creation order).
const SERIES_VARS = ["--series-1", "--series-2", "--series-3", "--series-4"];
const TARGET_MAX = 1000;
const COUNT_MAX = 100000;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Parses a bare "YYYY-MM-DD" as local midnight, avoiding UTC-parse day-shift. */
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WorkoutGoalsPage() {
  const [goals, setGoals] = useState<WorkoutGoal[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [type, setType] = useState("");
  const [target, setTarget] = useState("3");
  const [saving, setSaving] = useState(false);

  // goalId -> draft target text while its inline editor is open.
  const [editing, setEditing] = useState<Record<string, string>>({});
  // goalId -> draft "log progress" amount text.
  const [logDraft, setLogDraft] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [g, w] = await Promise.all([
        apiFetch<WorkoutGoal[]>("/api/workout-goals"),
        apiFetch<Workout[]>("/api/workouts"),
      ]);
      setGoals(g);
      setWorkouts(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!type.trim()) return;
    const targetNum = Math.round(Number(target));
    if (!Number.isFinite(targetNum) || targetNum < 1 || targetNum > TARGET_MAX) {
      setError(`Target per week must be between 1 and ${TARGET_MAX}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const created = await apiFetch<WorkoutGoal>("/api/workout-goals", {
        method: "POST",
        body: JSON.stringify({ workoutType: type.trim(), targetPerWeek: targetNum }),
      });
      setGoals((prev) => [...prev, created]);
      setType("");
      setTarget("3");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add goal");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(goal: WorkoutGoal) {
    setEditing((prev) => ({ ...prev, [goal.id]: String(goal.targetPerWeek) }));
  }

  function cancelEdit(id: string) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  async function saveEdit(goal: WorkoutGoal) {
    const targetNum = Math.round(Number(editing[goal.id]));
    if (!Number.isFinite(targetNum) || targetNum < 1 || targetNum > TARGET_MAX) {
      setError(`Target per week must be between 1 and ${TARGET_MAX}.`);
      return;
    }

    setError(null);
    try {
      const updated = await apiFetch<WorkoutGoal>(`/api/workout-goals/${goal.id}`, {
        method: "PATCH",
        body: JSON.stringify({ targetPerWeek: targetNum }),
      });
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? updated : g)));
      cancelEdit(goal.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal");
    }
  }

  async function handleDeleteGoal(id: string) {
    try {
      await apiFetch(`/api/workout-goals/${id}`, { method: "DELETE" });
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete goal");
    }
  }

  async function logProgress(goal: WorkoutGoal) {
    const n = Math.round(Number(logDraft[goal.id]));
    if (!Number.isFinite(n) || n < 1 || n > COUNT_MAX) {
      setError(`Progress count must be between 1 and ${COUNT_MAX}.`);
      return;
    }

    setError(null);
    try {
      const created = await apiFetch<Workout>("/api/workouts", {
        method: "POST",
        body: JSON.stringify({ date: today(), type: goal.workoutType, count: n }),
      });
      setWorkouts((prev) => [created, ...prev]);
      setLogDraft((prev) => ({ ...prev, [goal.id]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log progress");
    }
  }

  async function deleteEntry(id: string) {
    try {
      await apiFetch(`/api/workouts/${id}`, { method: "DELETE" });
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    }
  }

  const now = new Date();
  const progress = goals.map((goal, i) => ({
    goal,
    colorVar: SERIES_VARS[i % SERIES_VARS.length],
    ...weeklyGoalProgress(workouts, goal.workoutType, goal.targetPerWeek, now),
  }));

  const overallPct = progress.length
    ? Math.round(progress.reduce((sum, p) => sum + Math.min(p.pct, 100), 0) / progress.length)
    : 0;
  const goalsHit = progress.filter((p) => p.pct >= 100).length;

  return (
    <div className="goals viz-root">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Weekly goals</h1>
      <p className="lead">
        Set a weekly target for each kind of workout, then log progress as you go — each entry's
        count adds to the week's total (10 push-ups today + 10 tomorrow = 20 toward the goal).
      </p>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <>
          {goals.length > 0 && (
            <section className="hero-grid" aria-label="This week's goal progress">
              <div className="hero-card ring-card">
                <ActivityRing
                  fraction={overallPct / 100}
                  value={`${overallPct}%`}
                  caption="of weekly goals"
                  colorVar="--series-2"
                />
                <div className="hero-card-label">
                  <span className="hero-title">This week</span>
                  <span className="hero-sub">
                    {goalsHit} of {goals.length} goal{goals.length === 1 ? "" : "s"} fully hit
                  </span>
                </div>
              </div>
            </section>
          )}

          <form onSubmit={handleAdd} className="upload-form">
            <label>
              Workout type
              <input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Run, Lift, Push ups…"
                required
              />
            </label>
            <label>
              Target per week
              <input
                type="number"
                min={1}
                max={TARGET_MAX}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add goal"}
            </button>
          </form>

          {progress.length === 0 ? (
            <p>No goals yet. Add one above — e.g. "Push ups" x100 per week.</p>
          ) : (
            <div className="goals-grid">
              {progress.map(({ goal, colorVar, count, target: goalTarget, pct }) => {
                const trend = weeklyGoalTotals(workouts, goal.workoutType, 8, now).map((b) => ({
                  label: b.label,
                  value: b.count,
                }));
                const draft = editing[goal.id];
                const recent = workouts
                  .filter((w) => w.type.toLowerCase() === goal.workoutType.toLowerCase())
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 5);

                return (
                  <div className="goal-card" key={goal.id}>
                    <div className="goal-card-head">
                      <span className="goal-type">
                        <span className="series-dot" style={{ background: `var(${colorVar})` }} />
                        {goal.workoutType}
                      </span>
                      <button className="delete" onClick={() => handleDeleteGoal(goal.id)}>
                        Delete
                      </button>
                    </div>

                    <div className="goal-ring-row">
                      <ActivityRing
                        fraction={pct / 100}
                        value={`${pct}%`}
                        caption={`${count} / ${goalTarget} this week`}
                        size={104}
                        colorVar={colorVar}
                      />

                      {draft !== undefined ? (
                        <div className="goal-edit-target">
                          <label>
                            Weekly target
                            <input
                              type="number"
                              min={1}
                              max={TARGET_MAX}
                              value={draft}
                              onChange={(e) =>
                                setEditing((prev) => ({ ...prev, [goal.id]: e.target.value }))
                              }
                            />
                          </label>
                          <div className="draft-actions">
                            <button onClick={() => saveEdit(goal)}>Save</button>
                            <button className="secondary" onClick={() => cancelEdit(goal.id)}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button className="secondary" onClick={() => startEdit(goal)}>
                          Edit target
                        </button>
                      )}
                    </div>

                    <form
                      className="goal-log-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        logProgress(goal);
                      }}
                    >
                      <label>
                        Log progress (today)
                        <input
                          type="number"
                          min={1}
                          max={COUNT_MAX}
                          placeholder="e.g. 10"
                          value={logDraft[goal.id] ?? ""}
                          onChange={(e) =>
                            setLogDraft((prev) => ({ ...prev, [goal.id]: e.target.value }))
                          }
                        />
                      </label>
                      <button type="submit">Log</button>
                    </form>

                    {recent.length > 0 && (
                      <ul className="goal-achievements">
                        {recent.map((w) => (
                          <li key={w.id}>
                            <span className="goal-achievement-date">{formatDate(w.date)}</span>
                            <span className="goal-achievement-count">+{w.count}</span>
                            <button
                              className="row-remove"
                              onClick={() => deleteEntry(w.id)}
                              aria-label="Delete entry"
                            >
                              ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    <BarChart
                      data={trend}
                      height={140}
                      ariaLabel={`${goal.workoutType} per week`}
                      emptyMessage={`No ${goal.workoutType} logged yet.`}
                      colorVar={colorVar}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
