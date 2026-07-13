import type { BodyPhoto, BodyPhotoAngle } from "@health-tracker/shared";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";
import { signedPhotoUrl, uploadBodyPhoto } from "../lib/bodyPhotos";

function PhotoCard({ photo, onDelete }: { photo: BodyPhoto; onDelete: (id: string) => void }) {
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

  return (
    <div className="photo-card">
      <div className="photo-img">
        {url ? <img src={url} alt={`${photo.angle} progress photo`} /> : <div className="img-skeleton" />}
        <span className="angle-badge">{photo.angle}</span>
      </div>
      <div className="photo-meta">
        <div className="photo-date">{new Date(photo.takenAt).toLocaleDateString()}</div>
        <button className="delete" onClick={() => onDelete(photo.id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function BodyPhotosPage() {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<BodyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [angle, setAngle] = useState<BodyPhotoAngle>("front");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await apiFetch<BodyPhoto[]>("/api/body-photos");
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
      const created = await apiFetch<BodyPhoto>("/api/body-photos", {
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

  return (
    <div className="body-photos">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Body photos</h1>
      <p className="lead">
        A private visual timeline of your progress. Shoot the same angle in similar lighting for
        the most useful comparisons — line them up side by side under Progress in your head, or
        just scroll back through them over time.
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
          {busy ? "Uploading…" : "Upload"}
        </button>
      </form>

      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}

      <p className="disclaimer">
        Photos are stored privately and only ever shown to you via short-lived signed links.
      </p>

      {loading ? (
        <p>Loading…</p>
      ) : photos.length === 0 ? (
        <p>No photos yet. Upload your first one above.</p>
      ) : (
        <div className="photo-grid">
          {photos.map((p) => (
            <PhotoCard key={p.id} photo={p} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
