import { Link } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export function DashboardPage() {
  const { session } = useAuth();

  return (
    <div className="dashboard">
      <h1>Welcome{session?.user.email ? `, ${session.user.email}` : ""}</h1>
      <p>Your health tracking dashboard will live here.</p>
      <p>
        <Link to="/assessment">Take your initial assessment →</Link>
      </p>
      <button onClick={() => supabase.auth.signOut()}>Log out</button>
    </div>
  );
}
