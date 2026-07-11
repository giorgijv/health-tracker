import type { ActivityLevel, Assessment, AssessmentIntake } from "@health-tracker/shared";
import { useState, type FormEvent } from "react";
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

export function AssessmentPage() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [result, setResult] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const intake: AssessmentIntake = {
      age: numOrNull(form.age) as number | null,
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
      const assessment = await apiFetch<Assessment>("/api/assessments", {
        method: "POST",
        body: JSON.stringify({ type: "initial", intake }),
      });
      setResult(assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const s = result.summary;
    return (
      <div className="assessment">
        <p>
          <Link to="/">← Dashboard</Link>
        </p>
        <h1>Your assessment</h1>
        <p className="level">
          Overall level: <strong>{s.overallLevel}</strong>
        </p>

        {s.narrative.split("\n").filter(Boolean).map((para, i) => (
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
          This is coaching guidance generated from what you told us — not medical
          advice. If anything here concerns you, talk to a qualified professional.
        </p>
        <button onClick={() => setResult(null)}>Start a new assessment</button>
      </div>
    );
  }

  return (
    <div className="assessment">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Initial assessment</h1>
      <p>Tell us where you are today. This takes a couple of minutes.</p>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <label>
            Age
            <input
              type="number"
              value={form.age}
              onChange={(e) => update("age", e.target.value)}
              min={1}
              max={120}
            />
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
            <input
              type="number"
              value={form.heightCm}
              onChange={(e) => update("heightCm", e.target.value)}
            />
          </label>
          <label>
            Weight (kg)
            <input
              type="number"
              value={form.weightKg}
              onChange={(e) => update("weightKg", e.target.value)}
            />
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

        <button type="submit" disabled={submitting}>
          {submitting ? "Generating your assessment…" : "Get my assessment"}
        </button>
      </form>
    </div>
  );
}
