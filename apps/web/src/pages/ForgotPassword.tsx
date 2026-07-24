import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Redirect to the site root, not into a hash route: the recovery link
    // Supabase sends appends #access_token=...&type=recovery to this URL,
    // and HashRouter would otherwise try (and fail) to match that as a
    // path. AuthProvider picks up the PASSWORD_RECOVERY event regardless of
    // which route the app happens to land on.
    const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    setSubmitting(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <h1>Check your email</h1>
        <p>If an account exists for {email}, we sent a password reset link to it.</p>
        <p>
          <Link to="/login">Back to log in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <h1>Reset your password</h1>
      <p>Enter your email and we'll send you a link to set a new password.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <p>
        <Link to="/login">Back to log in</Link>
      </p>
    </div>
  );
}
