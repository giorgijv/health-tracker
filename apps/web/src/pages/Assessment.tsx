import type { ActivityLevel, Assessment, AssessmentIntake } from "@health-tracker/shared";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

type FormState = {
  age: string;
  sex: "" | "male" | "female" | "other";
  heightCm: string;
  weightKg: string;
  activityLevel: "" | ActivityLevel;
  goals: string;
  injuriesOrConditions: string;
  currentExercise: string;
  sleepHoursTypical: string;
  dietNotes: string;
};

const emptyForm: FormState = {
  age: "",
  sex: "",
  heightCm: "",
  weightKg: "",
  activityLevel: "",
  goals: "",
  injuriesOrConditions: "",
  currentExercise: "",
  sleepHoursTypical: "",
  dietNotes: "",
};

function numOrNull(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

function SummaryView({ assessment }: { assessment: Assessment }) {
  const s = assessment.summary;
  return (
    <>
      <p className="level">
        Overall level: <strong>{s.overallLevel}</strong>
        {assessment.type === "periodic" && <span className="pill medium">re-assessment</span>}
      </p>

      {s.progressSinceLast && (
        <div className="progress-since">
          <h2>How far you've come</h2>
          <p>{s.progressSinceLast}</p>
        </div>
      )}

      {s.narrative
        .split("\n")
        .filter(Boolean)
        .map((para, i) => (
          <p key={i}>{para}</p>
        ))}

      <h2>Focus areas</h2>
      <ol className="focus-areas">
        {s.focusAreas.map((fa, i) => (
          <li key={i}>
            <strong>{fa.title}</strong> <span className={`pill ${fa.priority}`}>{fa.priority}</span>
            <div>{fa.rationale}</div>
          </li>
        ))}
      </ol>

      {s.strengths.length > 0 && (
        <>
          <h2>Strengths</h2>
          <ul>
            {s.strengths.map((str, i) => (
              <li key={i}>{str}</li>
            ))}
          </ul>
        </>
      )}

      {s.cautions.length > 0 && (
        <>
          <h2>Things to be careful about</h2>
          <ul className="cautions">
            {s.cautions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </>
      )}

      <p className="disclaimer">
        Coaching guidance — not medical advice. If anything here concerns you, talk to a qualified
        professional.
      </p>
    </>
  );
}

export function AssessmentPage() {
  const [history, setHistory] = useState<Assessment[]>([]);
  const [active, setActive] = useState<Assessment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reassessing, setReassessing] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const list = await apiFetch<Assessment[]>("/api/assessments");
        setHistory(list);
        setActive(list[0] ?? null);
        setShowForm(list.length === 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submitInitial(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const intake: AssessmentIntake = {
      age: numOrNull(form.age),
      sex: form.sex === "" ? null : form.sex,
      heightCm: numOrNull(form.heightCm),
      weightKg: numOrNull(form.weightKg),
      activityLevel: form.activityLevel === "" ? null : form.activityLevel,
      goals: form.goals
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
      injuriesOrConditions: form.injuriesOrConditions,
      currentExercise: form.currentExercise,
      sleepHoursTypical: numOrNull(form.sleepHoursTypical),
      dietNotes: form.dietNotes,
    };

    try {
      const created = await apiFetch<Assessment>("/api/assessments", {
        method: "POST",
        body: JSON.stringify({ type: "initial", intake }),
      });
      setHistory((h) => [created, ...h]);
      setActive(created);
      setShowForm(false);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function runReassessment() {
    setReassessing(true);
    setError(null);
    try {
      const created = await apiFetch<Assessment>("/api/assessments/periodic", { method: "POST" });
      setHistory((h) => [created, ...h]);
      setActive(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Re-assessment failed");
    } finally {
      setReassessing(false);
    }
  }

  if (loading) {
    return (
      <div className="assessment">
        <p>
          <Link to="/">← Dashboard</Link>
        </p>
        <p>Loading…</p>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="assessment">
        <p>
          <Link to="/">← Dashboard</Link>
        </p>
        <h1>Initial assessment</h1>
        <p>Tell us where you are today. This takes a couple of minutes.</p>

        <form onSubmit={submitInitial}>
          <div className="row">
            <label>
              Age
              <input type="number" value={form.age} onChange={(e) => update("age", e.target.value)} min={1} max={120} />
            </label>
            <label>
              Sex
              <select value={form.sex} onChange={(e) => update("sex", e.target.value as FormState["sex"])}>
                <option value="">—</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>

          <div className="row">
            <label>
              Height (cm)
              <input type="number" value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} />
            </label>
            <label>
              Weight (kg)
              <input type="number" value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} />
            </label>
          </div>

          <label>
            Activity level
            <select
              value={form.activityLevel}
              onChange={(e) => update("activityLevel", e.target.value as FormState["activityLevel"])}
            >
              <option value="">—</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very active</option>
            </select>
          </label>

          <label>
            Typical sleep (hours/night)
            <input
              type="number"
              value={form.sleepHoursTypical}
              onChange={(e) => update("sleepHoursTypical", e.target.value)}
              min={0}
              max={24}
              step={0.5}
            />
          </label>

          <label>
            Goals (comma-separated)
            <input
              type="text"
              value={form.goals}
              onChange={(e) => update("goals", e.target.value)}
              placeholder="lose fat, run a 5k, build strength"
            />
          </label>

          <label>
            Current exercise routine
            <textarea
              value={form.currentExercise}
              onChange={(e) => update("currentExercise", e.target.value)}
              rows={3}
              placeholder="What do you currently do for exercise, and how often?"
            />
          </label>

          <label>
            Injuries or conditions
            <textarea
              value={form.injuriesOrConditions}
              onChange={(e) => update("injuriesOrConditions", e.target.value)}
              rows={2}
              placeholder="Anything we should be careful about? Leave blank if none."
            />
          </label>

          <label>
            Diet notes
            <textarea
              value={form.dietNotes}
              onChange={(e) => update("dietNotes", e.target.value)}
              rows={2}
              placeholder="How do you eat day to day?"
            />
          </label>

          {error && <p className="error">{error}</p>}

          <div className="draft-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? "Generating your assessment…" : "Get my assessment"}
            </button>
            {history.length > 0 && (
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="assessment">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Assessment</h1>

      <div className="assessment-actions">
        <button onClick={runReassessment} disabled={reassessing}>
          {reassessing ? "Reviewing your progress…" : "Run a re-assessment"}
        </button>
        <button className="secondary" onClick={() => setShowForm(true)}>
          New initial assessment
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {history.length > 1 && (
        <div className="assessment-history">
          {history.map((a) => (
            <button
              key={a.id}
              className={`history-chip ${active?.id === a.id ? "active" : ""}`}
              onClick={() => setActive(a)}
            >
              {a.type === "periodic" ? "Re-assessment" : "Initial"} ·{" "}
              {new Date(a.createdAt).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {active && <SummaryView assessment={active} />}
    </div>
  );
}
