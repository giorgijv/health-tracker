import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { apiFetch } from "../lib/api";
import { supabase } from "../lib/supabase";

export function SettingsPage() {
  const { session } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      await apiFetch("/api/account", { method: "DELETE" });
      // Account is gone — clear the (now-invalid) session; RequireAuth redirects to /login.
      await supabase.auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
      setDeleting(false);
    }
  }

  return (
    <div className="settings">
      <p>
        <Link to="/">← Dashboard</Link>
      </p>
      <h1>Settings</h1>

      <section>
        <h2>Account</h2>
        <p>Signed in as {session?.user.email}</p>
        <button onClick={() => supabase.auth.signOut()}>Log out</button>
      </section>

      <section>
        <h2>Your privacy</h2>
        <p>
          Your measurements, photos, and food logs are private to your account. Body photos are
          stored in a private bucket and are only ever shown to you through short-lived links.
          Nothing you log is shared with other users, and nothing you log is sent anywhere outside
          this app — there's no AI model involved.
        </p>
      </section>

      <section className="danger">
        <h2>Delete account</h2>
        <p>
          This permanently deletes your account and <strong>all</strong> of your data — profile,
          measurements, workouts, photos, and food logs. This cannot be undone.
        </p>
        <label>
          Type <code>DELETE</code> to confirm
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button
          className="delete-account"
          disabled={confirmText !== "DELETE" || deleting}
          onClick={deleteAccount}
        >
          {deleting ? "Deleting…" : "Delete my account and all data"}
        </button>
      </section>
    </div>
  );
}
