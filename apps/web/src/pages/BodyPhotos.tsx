import type { BodyPhoto, BodyPhotoAngle } from "@health-tracker/shared";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";
import { signedPhotoUrl, uploadBodyPhoto } from "../lib/bodyPhotos";

type PhotoWithError = BodyPhoto & { analysisError?: string };

function PhotoCard({ photo, onDelete, onRetry }: {
  photo: PhotoWithError;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    signedPhotoUrl(photo.storagePath).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [photo.storagePath]);

  const a = photo.analysis;

  return (
    <div className="photo-card">
      <div className="photo-img">
        {url ? <img src={url} alt={`${photo.angle} progress photo`} /> : <div className="img-skeleton" />}
        <span className="angle-badge">{photo.angle}</span>
      </div>
      <div className="photo-meta">
        <div className="photo-date">{new Date(photo.takenAt).toLocaleDateString()}</div>

        {a ? (
          <div className="analysis">
            <ul className="observations">
              {a.observations.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
            {a.comparisonToPrevious && (
              <p className="comparison">
                <strong>vs. previous:</strong> {a.comparisonToPrevious}
              </p>
            )}
            {a.estimatedBodyFatRange && (
              <p className="estimate">
                Rough body-fat estimate: <strong>{a.estimatedBodyFatRange}</strong>{" "}
                <span className={`conf ${a.confidence}`}>{a.confidence} confidence</span>
              </p>
            )}
            {a.cautions.length > 0 && (
              <ul className="cautions">
                {a.cautions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            )}
            <p className="encouragement">{a.encouragement}</p>
          </div>
        ) : (
          <div className="analysis-pending">
            <p>{photo.analysisError ?? "Not analyzed yet."}</p>
            <button onClick={() => onRetry(photo.id)}>Analyze</button>
          </div>
        )}

        <button className="delete" onClick={() => onDelete(photo.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function BodyPhotosPage() {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<PhotoWithError[]>([]);
  const [loading, setLoading] = useState(true);
  const [angle, setAngle] = useState<BodyPhotoAngle>("front");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<PhotoWithError[]>("/api/body-photos");
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: FormEvent) {
    e.preventDefault();
    if (!file || !session) return;
    setBusy(true);
    setError(null);

    try {
      setStatus("Uploading…");
      const storagePath = await uploadBodyPhoto(session.user.id, file);
      setStatus("Analyzing your photo — this can take a moment…");
      const created = await apiFetch<PhotoWithError>("/api/body-photos", {
        method: "POST",
        body: JSON.stringify({ storagePath, angle }),
      });
      setPhotos((prev) => [created, ...prev]);
      setFile(null);
      setStatus(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus(null);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiFetch(`/api/body-photos/${id}`, { method: "DELETE" });
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleRetry(id: string) {
    try {
      const updated = await apiFetch<PhotoWithError>(`/api/body-photos/${id}/analyze`, {
        method: "POST",
      });
      setPhotos((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  }

  return (
    <div className="body-photos">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Body photos</h1>
      <p className="lead">
        Track visible changes over time. Shoot the same angle in similar lighting for the most
        useful comparisons. Progress shows up better week to week than day to day, so AI analysis
        is limited to a couple of times a week — upload as often as you like, and analyze the ones
        you want a read on.
      </p>

      <form onSubmit={handleUpload} className="upload-form">
        <label>
          Angle
          <select value={angle} onChange={(e) => setAngle(e.target.value as BodyPhotoAngle)}>
            <option value="front">Front</option>
            <option value="side">Side</option>
            <option value="back">Back</option>
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
        <button type="submit" disabled={!file || busy}>
          {busy ? "Working…" : "Upload & analyze"}
        </button>
      </form>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      <p className="disclaimer">
        These are subjective visual impressions from your photos — not measurements or medical
        assessments. Pair them with the numbers you log under Progress.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : photos.length === 0 ? (
        <p>No photos yet. Upload your first one above.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} onDelete={handleDelete} onRetry={handleRetry} />
          ))}
        </div>
      )}
    </div>
  );
}
