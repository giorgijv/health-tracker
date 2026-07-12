import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

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
