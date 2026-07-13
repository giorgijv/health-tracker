import type { BodyMetric, FoodLog, Profile, Workout } from "@health-tracker/shared";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ActivityRing } from "../components/ActivityRing";
import { Icon, type IconName } from "../components/Icon";
import { Sparkline } from "../components/Sparkline";
import { apiFetch } from "../lib/api";
import { latestWithDelta, weightSeries, workoutsInLastDays } from "../lib/progress";

const WEEKLY_WORKOUT_GOAL = 3;

const FEATURES: { to: string; title: string; desc: string; icon: IconName; accent: string }[] = [
  { to: "/assessment", title: "Assessment", desc: "Your level, focus areas & progress reads", icon: "assessment", accent: "violet" },
  { to: "/progress", title: "Progress", desc: "Weight, workouts & trend charts", icon: "progress", accent: "blue" },
  { to: "/body-photos", title: "Body photos", desc: "A private visual timeline of your progress", icon: "photos", accent: "magenta" },
  { to: "/food-log", title: "Food log", desc: "Log your meals and macros", icon: "food", accent: "orange" },
  { to: "/recommendations", title: "Recommendations", desc: "What to focus on next", icon: "recommendations", accent: "yellow" },
  { to: "/coach", title: "Coach", desc: "Ask anything about your health", icon: "coach", accent: "aqua" },
];

interface TodayData {
  metrics: BodyMetric[];
  workouts: Workout[];
  todayCalories: number | null; // null = nothing logged today
}

function formatToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DashboardPage() {
  // null = "haven't checked yet", false = "checked, no redirect needed".
  // A profile row only exists once onboarding has been completed or skipped
  // (see Onboarding.tsx), so its absence is the "new user" signal.
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [today, setToday] = useState<TodayData | null>(null);

  useEffect(() => {
    apiFetch<Profile | null>("/api/profile")
      .then((profile) => setNeedsOnboarding(profile === null))
      .catch(() => setNeedsOnboarding(false)); // fail open — don't block the dashboard on a network hiccup
  }, []);

  useEffect(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    Promise.all([
      apiFetch<BodyMetric[]>("/api/metrics").catch(() => [] as BodyMetric[]),
      apiFetch<Workout[]>("/api/workouts").catch(() => [] as Workout[]),
      apiFetch<FoodLog[]>(`/api/food-logs?from=${todayIso}`).catch(() => [] as FoodLog[]),
    ]).then(([metrics, workouts, foodLogs]) => {
      const todaysMeals = foodLogs.filter((l) => l.eatenAt.slice(0, 10) === todayIso);
      setToday({
        metrics,
        workouts,
        todayCalories: todaysMeals.length
          ? Math.round(todaysMeals.reduce((s, l) => s + l.totals.calories, 0))
          : null,
      });
    });
  }, []);

  if (needsOnboarding === null) return null;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  const weight = today ? latestWithDelta(today.metrics, "weightKg") : null;
  const weightTrend = today ? weightSeries(today.metrics).slice(-10) : [];
  const workoutsThisWeek = today ? workoutsInLastDays(today.workouts, 7) : 0;

  return (
    <div className="dashboard-home viz-root">
      <header className="home-header">
        <h1>Health Tracker</h1>
        <Link className="icon-button" to="/settings" aria-label="Settings">
          <Icon name="settings" size={20} />
        </Link>
      </header>
      <p className="greeting">{formatToday()}</p>

      <section className="hero-grid" aria-label="Today at a glance">
        <div className="hero-card ring-card">
          <ActivityRing
            fraction={workoutsThisWeek / WEEKLY_WORKOUT_GOAL}
            value={`${workoutsThisWeek}`}
            caption={`of ${WEEKLY_WORKOUT_GOAL} workouts`}
            colorVar="--series-2"
          />
          <div className="hero-card-label">
            <span className="hero-title">This week</span>
            <span className="hero-sub">
              {workoutsThisWeek >= WEEKLY_WORKOUT_GOAL
                ? "Goal hit — nice work"
                : `${WEEKLY_WORKOUT_GOAL - workoutsThisWeek} to go`}
            </span>
          </div>
        </div>

        <Link to="/progress" className="hero-card metric-card accent-blue">
          <div className="hero-card-head">
            <span className="hero-icon"><Icon name="scale" size={18} /></span>
            <span className="hero-title">Weight</span>
          </div>
          {weight ? (
            <>
              <div className="hero-value">
                {weight.value}
                <span className="hero-unit"> kg</span>
              </div>
              {weight.delta != null && weight.delta !== 0 && (
                <span className={`hero-delta ${weight.delta < 0 ? "good" : "bad"}`}>
                  {weight.delta > 0 ? "▲" : "▼"} {Math.abs(weight.delta).toFixed(1)} kg
                </span>
              )}
              <Sparkline data={weightTrend} colorVar="--series-1" />
            </>
          ) : (
            <div className="hero-empty">Log your first weight</div>
          )}
        </Link>

        <Link to="/food-log" className="hero-card metric-card accent-orange">
          <div className="hero-card-head">
            <span className="hero-icon"><Icon name="flame" size={18} /></span>
            <span className="hero-title">Calories today</span>
          </div>
          {today?.todayCalories != null ? (
            <div className="hero-value">
              {today.todayCalories}
              <span className="hero-unit"> kcal</span>
            </div>
          ) : (
            <div className="hero-empty">No meals logged yet today</div>
          )}
        </Link>
      </section>

      <h2 className="section-title">Your tools</h2>
      <div className="feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="feature-card">
            <span className={`feature-icon accent-${f.accent}`}>
              <Icon name={f.icon} />
            </span>
            <span className="feature-text">
              <span className="feature-title">{f.title}</span>
              <span className="feature-desc">{f.desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
