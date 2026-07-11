import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabase";

export function DashboardPage() {
  const { session } = useAuth();

  return (
    <div className="dashboard">
      <h1>Welcome{session?.user.email ? `, ${session.user.email}` : ""}</h1>
      <p>Your health tracking dashboard will live here.</p>
      <button onClick={() => supabase.auth.signOut()}>Log out</button>
    </div>
  );
}
