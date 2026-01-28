import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import ProfilePage from "@/pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "./pages/Dashboard";
import { Layout } from "@/components/layout/Layout";
import ChatPage from "@/pages/ChatPage";

const History = () => (
  <div className="py-8 text-2xl font-bold">Your Activity History</div>
);

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("stress_companion_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    const dummyUser = {
      name: "Preeth",
      email: userData.email,
      avatarUrl: "https://github.com/shadcn.png",
    };
    setUser(dummyUser);
    localStorage.setItem("stress_companion_user", JSON.stringify(dummyUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("stress_companion_user");
    window.location.href = "/";
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" />
              ) : (
                <Layout user={user}>
                  <div className="flex items-center justify-center min-h-[80vh]">
                    <LoginForm onLoginSuccess={handleLogin} />
                  </div>
                </Layout>
              )
            }
          />
          <Route
            path="/signup"
            element={
              user ? (
                <Navigate to="/dashboard" />
              ) : (
                <Layout user={user}>
                  <div className="flex items-center justify-center min-h-[80vh]">
                    <RegisterForm />
                  </div>
                </Layout>
              )
            }
          />

          {/* PROTECTED ROUTES */}
          <Route
            path="/dashboard"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Dashboard />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/chat"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout} fullWidth={true}>
                  <ChatPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/history"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <History />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/profile"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <ProfilePage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/settings"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <SettingsPage />
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* HOME / ROOT */}
          <Route
            path="/"
            element={
              <Layout user={user} onLogout={handleLogout}>
                <div className="py-20 text-center">
                  <h1 className="text-4xl font-bold mb-4 tracking-tight md:text-6xl">
                    Welcome to Stress Companion
                  </h1>
                  <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                    Your personal mental health assistant, designed to help you
                    find balance and clarity.
                  </p>
                </div>
              </Layout>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
