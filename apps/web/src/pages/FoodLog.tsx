import { sumFoodItems, type FoodItem, type FoodLog, type MealType } from "@health-tracker/shared";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../lib/api";

interface Draft {
  items: FoodItem[];
}

const NUMERIC_FIELDS: (keyof FoodItem)[] = ["estGrams", "calories", "proteinG", "carbsG", "fatG"];

const blankItem = (): FoodItem => ({
  name: "",
  estGrams: 0,
  calories: 0,
  proteinG: 0,
  carbsG: 0,
  fatG: 0,
});

function FoodLogCard({ log, onDelete }: { log: FoodLog; onDelete: (id: string) => void }) {
  return (
    <div className="food-log-card">
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
        <button className="delete" onClick={() => onDelete(log.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function FoodLogPage() {
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
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
    setDraft((d) => (d ? { ...d, items: [...d.items, blankItem()] } : d));
  }

  async function handleSave() {
    if (!draft) return;
    setBusy(true);
    setError(null);
    try {
      const created = await apiFetch<FoodLog>("/api/food-logs", {
        method: "POST",
        body: JSON.stringify({ mealType, items: draft.items }),
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
          <button onClick={() => setDraft({ items: [blankItem()] })}>Log a meal</button>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {draft && totals && (
        <div className="draft-editor">
          <h2>Meal details</h2>
          <p className="editor-note">Enter what you ate — you can look up calories/macros or estimate.</p>

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
