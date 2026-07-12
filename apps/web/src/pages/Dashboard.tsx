import type { Profile } from "@health-tracker/shared";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";

const FEATURES: { to: string; title: string; desc: string }[] = [
  { to: "/assessment", title: "Assessment", desc: "Get your read and re-assess your progress" },
  { to: "/progress", title: "Progress", desc: "Log weight & workouts, see your trends" },
  { to: "/body-photos", title: "Body photos", desc: "Track visible changes with AI feedback" },
  { to: "/food-log", title: "Food log", desc: "Snap a meal for calories & macros" },
  { to: "/recommendations", title: "Recommendations", desc: "What to focus on next, from your data" },
  { to: "/coach", title: "Coach", desc: "Ask questions about your health & history" },
];

export function DashboardPage() {
  const { session } = useAuth();
  // null = "haven't checked yet", false = "checked, no redirect needed".
  // A profile row only exists once onboarding has been completed or skipped
  // (see Onboarding.tsx), so its absence is the "new user" signal — no extra
  // schema or flag needed.
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<Profile | null>("/api/profile")
      .then((profile) => setNeedsOnboarding(profile === null))
      .catch(() => setNeedsOnboarding(false)); // fail open — don't block the dashboard on a network hiccup
  }, []);

  if (needsOnboarding === null) return null;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;

  return (
    <div className="dashboard-home">
      <header className="home-header">
        <h1>Health Tracker</h1>
        <Link className="settings-link" to="/settings">
          Settings
        </Link>
      </header>
      {session?.user.email && <p className="greeting">Welcome back, {session.user.email}</p>}

      <div className="feature-grid">
        {FEATURES.map((f) => (
          <Link key={f.to} to={f.to} className="feature-card">
            <span className="feature-title">{f.title}</span>
            <span className="feature-desc">{f.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
