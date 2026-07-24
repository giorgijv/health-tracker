import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

// Rendered by App.tsx whenever AuthContext reports a password-recovery
// session, regardless of the current route — see AuthContext.tsx and
// ForgotPassword.tsx for why a specific /reset-password route can't be
// relied on with HashRouter + Supabase's hash-based recovery link.
export function ResetPasswordPage() {
  const { clearPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    clearPasswordRecovery();
    navigate("/", { replace: true });
  }

  return (
    <div className="auth-page">
      <h1>Set a new password</h1>
      <form onSubmit={handleSubmit}>
        <label>
          New password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </div>
  );
}
