import type { Recommendation, RecommendationRun, RecommendationStatus } from "@health-tracker/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

function RecommendationCard({
  rec,
  onStatus,
}: {
  rec: Recommendation;
  onStatus: (id: string, status: RecommendationStatus) => void;
}) {
  return (
    <div className={`rec-card ${rec.status}`}>
      <div className="rec-head">
        <span className={`rec-cat ${rec.category}`}>{rec.category}</span>
        <span className={`rec-pri ${rec.priority}`}>{rec.priority}</span>
      </div>
      <h3>{rec.title}</h3>
      <p>{rec.detail}</p>
      {rec.basis && <p className="rec-basis">Based on: {rec.basis}</p>}
      <div className="rec-actions">
        {rec.status !== "done" && (
          <button onClick={() => onStatus(rec.id, "done")}>Mark done</button>
        )}
        {rec.status !== "dismissed" && (
          <button className="secondary" onClick={() => onStatus(rec.id, "dismissed")}>
            Dismiss
          </button>
        )}
        {rec.status !== "active" && (
          <button className="secondary" onClick={() => onStatus(rec.id, "active")}>
            Reactivate
          </button>
        )}
      </div>
    </div>
  );
}

export function RecommendationsPage() {
  const [run, setRun] = useState<RecommendationRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadLatest() {
    setLoading(true);
    try {
      setRun(await apiFetch<RecommendationRun | null>("/api/recommendations/latest"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLatest();
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const fresh = await apiFetch<RecommendationRun>("/api/recommendations/generate", {
        method: "POST",
      });
      setRun(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function setStatus(id: string, status: RecommendationStatus) {
    // optimistic
    setRun((r) =>
      r
        ? { ...r, recommendations: r.recommendations.map((x) => (x.id === id ? { ...x, status } : x)) }
        : r,
    );
    try {
      await apiFetch(`/api/recommendations/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
      loadLatest();
    }
  }

  const visible = run?.recommendations.filter((r) => r.status !== "dismissed") ?? [];
  const dismissedCount = run ? run.recommendations.length - visible.length : 0;

  return (
    <div className="recommendations">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Recommendations</h1>
      <p className="lead">
        A read of your recent tracking, with the few things worth focusing on next.
      </p>

      <button className="generate" onClick={generate} disabled={generating}>
        {generating ? "Analyzing your data…" : run ? "Regenerate" : "Generate recommendations"}
      </button>

      {error && <p className="error">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : !run ? (
        <p>No recommendations yet. Generate your first set once you've logged some data.</p>
      ) : (
        <>
          <div className="rec-summary">
            <p>{run.summary}</p>
            <span className="rec-date">{new Date(run.createdAt).toLocaleString()}</span>
          </div>

          <div className="rec-list">
            {visible.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} onStatus={setStatus} />
            ))}
          </div>

          {dismissedCount > 0 && (
            <p className="dismissed-note">{dismissedCount} dismissed</p>
          )}
        </>
      )}

      <p className="disclaimer">
        Coaching guidance based on the data you've logged — not medical advice.
      </p>
    </div>
  );
}
