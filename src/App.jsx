import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import { Layout } from "@/components/layout/Layout";
import ReportPage from "./pages/ReportPage";
import StressAnalysisSession from "./pages/StressAnalysisSession";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useAuthStore } from "@/store/useAuthStore";
import { Toaster } from "@/components/ui/sonner";

import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import { MobileWarning } from "@/components/layout/MobileWarning";

// Helper component for public-only routes (like login/signup)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Layout user={user} onLogout={logout}>{children}</Layout>;
};

export default function App() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <MobileWarning />
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div className="flex items-center justify-center min-h-[80vh]">
                  <LoginForm />
                </div>
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <div className="flex items-center justify-center min-h-[80vh]">
                  <RegisterForm />
                </div>
              </PublicRoute>
            }
          />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={

                <StressAnalysisSession />

            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history/:sessionId"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* HOME / ROOT */}
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Layout user={user} onLogout={logout}>
                  <LandingPage />
                </Layout>
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}
