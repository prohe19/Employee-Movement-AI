import { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { PrismLogo } from "./components/PrismLogo";
import { LoginPage } from "./pages/LoginPage";
import { SignUpPage } from "./pages/SignUpPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreatePage } from "./pages/create/CreatePage";
import { RecordsPage } from "./pages/RecordsPage";
import { TransferFormEditPage } from "./pages/TransferFormEditPage";
import { SettingsPage } from "./pages/SettingsPage";

function FullScreenLoader() {
  return (
    <div className="neon-backdrop center-screen">
      <div className="cp-glow">
        <PrismLogo size={72} />
      </div>
    </div>
  );
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignUpPage />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/create"
        element={
          <RequireAuth>
            <CreatePage />
          </RequireAuth>
        }
      />
      <Route
        path="/create/:id"
        element={
          <RequireAuth>
            <CreatePage />
          </RequireAuth>
        }
      />
      <Route path="/transfer-forms" element={<Navigate to="/records?tab=transfer-forms" replace />} />
      <Route
        path="/transfer-forms/new"
        element={
          <RequireAuth>
            <TransferFormEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/transfer-forms/:id"
        element={
          <RequireAuth>
            <TransferFormEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/records"
        element={
          <RequireAuth>
            <RecordsPage />
          </RequireAuth>
        }
      />
      <Route path="/templates" element={<Navigate to="/settings?tab=templates" replace />} />
      <Route path="/signatories" element={<Navigate to="/settings?tab=signatories" replace />} />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
