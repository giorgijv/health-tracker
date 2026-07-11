import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { AssessmentPage } from "./pages/Assessment";
import { DashboardPage } from "./pages/Dashboard";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/assessment"
        element={
          <RequireAuth>
            <AssessmentPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
