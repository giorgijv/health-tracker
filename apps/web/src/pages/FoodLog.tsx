import {
  FOOD_PHOTOS_BUCKET,
  sumFoodItems,
  type FoodAnalysis,
  type FoodItem,
  type FoodLog,
  type MealType,
} from "@health-tracker/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";
import { signedUrl, uploadImage } from "../lib/storage";

interface Draft {
  storagePath: string;
  analysis: FoodAnalysis;
  items: FoodItem[];
}

const NUMERIC_FIELDS: (keyof FoodItem)[] = ["estGrams", "calories", "proteinG", "carbsG", "fatG"];

function FoodLogCard({ log, onDelete }: { log: FoodLog; onDelete: (id: string) => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signedUrl(FOOD_PHOTOS_BUCKET, log.storagePath).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [log.storagePath]);

  return (
    <div className="food-log-card">
      {url ? <img src={url} alt="meal" /> : <div className="img-skeleton" />}
      <div className="food-log-body">
        <div className="food-log-head">
          <span className="meal-type">{log.mealType}</span>
          <span className="food-log-date">{new Date(log.eatenAt).toLocaleDateString()}</span>
        </div>
        <div className="food-totals">
          <strong>{Math.round(log.totals.calories)} kcal</strong>
          <span>
            P {Math.round(log.totals.proteinG)} · C {Math.round(log.totals.carbsG)} · F{" "}
            {Math.round(log.totals.fatG)}
          </span>
        </div>
        <ul className="food-items-mini">
          {log.items.map((it, i) => (
            <li key={i}>
              {it.name} <span>{Math.round(it.estGrams)} g</span>
            </li>
          ))}
        </ul>
        {log.nutritionalQuality && (
          <p className={`quality ${log.nutritionalQuality.rating}`}>
            {log.nutritionalQuality.rating}: {log.nutritionalQuality.notes}
          </p>
        )}
        <button className="delete" onClick={() => onDelete(log.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function FoodLogPage() {
  const { session } = useAuth();
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [file, setFile] = useState<File | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setLogs(await apiFetch<FoodLog[]>("/api/food-logs"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAnalyze() {
    if (!file || !session) return;
    setBusy(true);
    setError(null);
    try {
      setStatus("Uploading…");
      const storagePath = await uploadImage(FOOD_PHOTOS_BUCKET, session.user.id, file);
      setStatus("Estimating calories and macros…");
      const analysis = await apiFetch<FoodAnalysis>("/api/food-logs/analyze", {
        method: "POST",
        body: JSON.stringify({ storagePath }),
      });
      setDraft({ storagePath, analysis, items: analysis.items.map((it) => ({ ...it })) });
      setFile(null);
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  function updateItem(index: number, field: keyof FoodItem, value: string) {
    setDraft((d) => {
      if (!d) return d;
      const items = d.items.map((it, i) => {
        if (i !== index) return it;
        if (field === "name") return { ...it, name: value };
        return { ...it, [field]: Number(value) || 0 };
      });
      return { ...d, items };
    });
  }

  function removeItem(index: number) {
    setDraft((d) => (d ? { ...d, items: d.items.filter((_, i) => i !== index) } : d));
  }

  function addItem() {
    setDraft((d) =>
      d
        ? {
            ...d,
            items: [...d.items, { name: "", estGrams: 0, calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }],
          }
        : d,
    );
  }

  async function handleSave() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<FoodLog>("/api/food-logs", {
        method: "POST",
        body: JSON.stringify({
          storagePath: draft.storagePath,
          mealType,
          items: draft.items,
          confidence: draft.analysis.confidence,
          nutritionalQuality: draft.analysis.nutritionalQuality,
          aiAnalysis: draft.analysis,
        }),
      });
      setLogs((prev) => [created, ...prev]);
      setDraft(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/food-logs/${id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const totals = draft ? sumFoodItems(draft.items) : null;

  return (
    <div className="food-log">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Food log</h1>

      {!draft && (
        <div className="upload-form">
          <label>
            Meal
            <select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </label>
          <label>
            Photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <button onClick={handleAnalyze} disabled={!file || busy}>
            {busy ? "Working…" : "Analyze photo"}
          </button>
        </div>
      )}

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      {draft && totals && (
        <div className="draft-editor">
          <h2>Review &amp; edit</h2>
          <p className="editor-note">
            These are estimates{" "}
            <span className={`conf ${draft.analysis.confidence}`}>
              {draft.analysis.confidence} confidence
            </span>
            . Adjust anything before you log it.
          </p>

          <div className="items-table">
            <div className="items-head">
              <span>Item</span>
              <span>g</span>
              <span>kcal</span>
              <span>P</span>
              <span>C</span>
              <span>F</span>
              <span></span>
            </div>
            {draft.items.map((it, i) => (
              <div className="items-row" key={i}>
                <input value={it.name} onChange={(e) => updateItem(i, "name", e.target.value)} />
                {NUMERIC_FIELDS.map((f) => (
                  <input
                    key={f}
                    type="number"
                    value={it[f] as number}
                    onChange={(e) => updateItem(i, f, e.target.value)}
                  />
                ))}
                <button className="row-remove" onClick={() => removeItem(i)} aria-label="Remove">
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button className="add-item" onClick={addItem}>
            + Add item
          </button>

          <div className="draft-totals">
            <strong>{Math.round(totals.calories)} kcal</strong> · P {Math.round(totals.proteinG)} ·
            C {Math.round(totals.carbsG)} · F {Math.round(totals.fatG)}
          </div>

          <p className={`quality ${draft.analysis.nutritionalQuality.rating}`}>
            {draft.analysis.nutritionalQuality.rating}: {draft.analysis.nutritionalQuality.notes}
          </p>

          {draft.analysis.cautions.length > 0 && (
            <ul className="cautions">
              {draft.analysis.cautions.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          )}

          <div className="draft-actions">
            <button onClick={handleSave} disabled={busy || draft.items.length === 0}>
              {busy ? "Saving…" : "Log this meal"}
            </button>
            <button className="secondary" onClick={() => setDraft(null)} disabled={busy}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <h2>Recent meals</h2>
      {loading ? (
        <p>Loading…</p>
      ) : logs.length === 0 ? (
        <p>No meals logged yet.</p>
      ) : (
        <div className="food-log-grid">
          {logs.map((l) => (
            <FoodLogCard key={l.id} log={l} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
