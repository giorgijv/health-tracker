import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { BodyPhotosPage } from "./pages/BodyPhotos";
import { DashboardPage } from "./pages/Dashboard";
import { ForgotPasswordPage } from "./pages/ForgotPassword";
import { FoodLogPage } from "./pages/FoodLog";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { ProgressPage } from "./pages/Progress";
import { ResetPasswordPage } from "./pages/ResetPassword";
import { SettingsPage } from "./pages/Settings";
import { SignupPage } from "./pages/Signup";
import { WorkoutGoalsPage } from "./pages/WorkoutGoals";

function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  const { passwordRecovery } = useAuth();
  // Takes over the whole app the instant Supabase reports a recovery
  // session, independent of whatever route the recovery link's hash
  // fragment happened to land on (see AuthContext.tsx / ForgotPassword.tsx).
  if (passwordRecovery) return <ResetPasswordPage />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/progress"
        element={
          <RequireAuth>
            <ProgressPage />
          </RequireAuth>
        }
      />
      <Route
        path="/body-photos"
        element={
          <RequireAuth>
            <BodyPhotosPage />
          </RequireAuth>
        }
      />
      <Route
        path="/food-log"
        element={
          <RequireAuth>
            <FoodLogPage />
          </RequireAuth>
        }
      />
      <Route
        path="/goals"
        element={
          <RequireAuth>
            <WorkoutGoalsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      {/* Catches old links/bookmarks to removed pages (/assessment, /recommendations, /coach). */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
