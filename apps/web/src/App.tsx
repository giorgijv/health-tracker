import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/AuthContext";
import { AssessmentPage } from "./pages/Assessment";
import { BodyPhotosPage } from "./pages/BodyPhotos";
import { CoachPage } from "./pages/Coach";
import { DashboardPage } from "./pages/Dashboard";
import { FoodLogPage } from "./pages/FoodLog";
import { LoginPage } from "./pages/Login";
import { OnboardingPage } from "./pages/Onboarding";
import { ProgressPage } from "./pages/Progress";
import { RecommendationsPage } from "./pages/Recommendations";
import { SettingsPage } from "./pages/Settings";
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
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
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
        path="/recommendations"
        element={
          <RequireAuth>
            <RecommendationsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/coach"
        element={
          <RequireAuth>
            <CoachPage />
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
    </Routes>
  );
}
