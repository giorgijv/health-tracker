import type { ActivityLevel, Profile } from "@health-tracker/shared";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

type Step = "about" | "weight" | "assessment";
const STEPS: Step[] = ["about", "weight", "assessment"];

type AboutForm = {
  age: string;
  sex: "" | "male" | "female" | "other";
  heightCm: string;
  activityLevel: "" | ActivityLevel;
  goals: string;
};

function numOrNull(v: string): number | null {
  const n = Number(v);
  return v.trim() === "" || Number.isNaN(n) ? null : n;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("about");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  const [about, setAbout] = useState<AboutForm>({
    age: "",
    sex: "",
    heightCm: "",
    activityLevel: "",
    goals: "",
  });
  const [weightKg, setWeightKg] = useState("");

  function updateAbout<K extends keyof AboutForm>(key: K, value: AboutForm[K]) {
    setAbout((a) => ({ ...a, [key]: value }));
  }

  /** Save whatever's in the "about you" form. Marks onboarding as seen — the
   * dashboard only redirects here when no profile row exists yet — so this
   * must run before advancing past step 1, even on skip. */
  async function saveProfile() {
    if (profileSaved) return;
    await apiFetch<Profile>("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        age: numOrNull(about.age),
        sex: about.sex === "" ? null : about.sex,
        heightCm: numOrNull(about.heightCm),
        activityLevel: about.activityLevel === "" ? null : about.activityLevel,
        goals: about.goals
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
      }),
    });
    setProfileSaved(true);
  }

  async function handleAboutSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveProfile();
      setStep("weight");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleWeightSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const kg = numOrNull(weightKg);
      if (kg != null) {
        await apiFetch("/api/metrics", {
          method: "POST",
          body: JSON.stringify({ date: new Date().toISOString().slice(0, 10), weightKg: kg }),
        });
      }
      setStep("assessment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save — try again");
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    setSaving(true);
    setError(null);
    try {
      await saveProfile();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't skip — try again");
      setSaving(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="onboarding">
      <div className="onboarding-head">
        <div className="onboarding-steps">
          {STEPS.map((s, i) => (
            <span key={s} className={`step-dot ${i <= stepIndex ? "done" : ""}`} />
          ))}
        </div>
        <button className="skip-link" onClick={handleSkip} disabled={saving}>
          Skip for now
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {step === "about" && (
        <>
          <h1>Welcome — let's set you up</h1>
          <p className="lead">
            A little context helps your assessments, recommendations, and coach chat give you
            better, more specific answers. Everything here is optional.
          </p>
          <form onSubmit={handleAboutSubmit}>
            <div className="row">
              <label>
                Age
                <input
                  type="number"
                  value={about.age}
                  onChange={(e) => updateAbout("age", e.target.value)}
                  min={1}
                  max={120}
                />
              </label>
              <label>
                Sex
                <select
                  value={about.sex}
                  onChange={(e) => updateAbout("sex", e.target.value as AboutForm["sex"])}
                >
                  <option value="">—</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </label>
            </div>
            <label>
              Height (cm)
              <input
                type="number"
                value={about.heightCm}
                onChange={(e) => updateAbout("heightCm", e.target.value)}
              />
            </label>
            <label>
              Activity level
              <select
                value={about.activityLevel}
                onChange={(e) =>
                  updateAbout("activityLevel", e.target.value as AboutForm["activityLevel"])
                }
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
              Goals (comma-separated)
              <input
                type="text"
                value={about.goals}
                onChange={(e) => updateAbout("goals", e.target.value)}
                placeholder="lose fat, run a 5k, build strength"
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Continue"}
            </button>
          </form>
        </>
      )}

      {step === "weight" && (
        <>
          <h1>Log your starting weight</h1>
          <p className="lead">
            Optional, but it gives your Progress chart and future recommendations a baseline to
            measure from.
          </p>
          <form onSubmit={handleWeightSubmit}>
            <label>
              Weight (kg)
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                autoFocus
              />
            </label>
            <button type="submit" disabled={saving}>
              {saving ? "Saving…" : weightKg.trim() ? "Save & continue" : "Continue"}
            </button>
          </form>
        </>
      )}

      {step === "assessment" && (
        <>
          <h1>You're set up</h1>
          <p className="lead">
            One more thing worth doing now: a short questionnaire that gives you a personalized
            assessment — your current level, focus areas, and things to watch. Takes about two
            minutes, and you can always do it later from the dashboard.
          </p>
          <div className="onboarding-actions">
            <button onClick={() => navigate("/assessment")}>Take the assessment now</button>
            <button className="secondary" onClick={() => navigate("/")}>
              Maybe later — go to dashboard
            </button>
          </div>
        </>
      )}
    </div>
  );
}
