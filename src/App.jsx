import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/features/auth/LoginForm";
import { RegisterForm } from "@/components/features/auth/RegisterForm";
import ProfilePage from "@/pages/ProfilePage";

// Dummy Dashboard Component for testing
const Dashboard = () => <div className="p-8 text-2xl font-bold">Welcome to your Dashboard!</div>;
const History = () => <div className="p-8 text-2xl font-bold">Your Activity History</div>;

// Layout Wrapper to keep Navbar consistent across pages
const Layout = ({ children, user, onLogout }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar user={user} onLogout={onLogout} />
    <main className="flex-1">
      {children}
    </main>
  </div>
);

export default function App() {
  const [user, setUser] = useState(null);

  // 1. Check for existing session on load
  useEffect(() => {
    const storedUser = localStorage.getItem("stress_companion_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // 2. Login Handler (passed to LoginForm)
  const handleLogin = (userData) => {
    const dummyUser = {
      name: "Preeth", 
      email: userData.email,
      avatarUrl: "https://github.com/shadcn.png" 
    };
    setUser(dummyUser);
    localStorage.setItem("stress_companion_user", JSON.stringify(dummyUser));
  };

  // 3. Logout Handler (passed to Navbar)
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("stress_companion_user");
    window.location.href = "/"; // Hard refresh to clear any sensitive state
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/dashboard" /> : (
              <Layout user={user}>
                <div className="flex items-center justify-center p-4 py-12">
                  <LoginForm onLoginSuccess={handleLogin} />
                </div>
              </Layout>
            )
          } 
        />
        <Route 
          path="/signup" 
          element={
            user ? <Navigate to="/dashboard" /> : (
              <Layout user={user}>
                <div className="flex items-center justify-center p-4 py-12">
                  <RegisterForm />
                </div>
              </Layout>
            )
          } 
        />

        {/* PROTECTED ROUTES (Require Login) */}
        <Route 
          path="/dashboard" 
          element={user ? <Layout user={user} onLogout={handleLogout}><Dashboard /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/history" 
          element={user ? <Layout user={user} onLogout={handleLogout}><History /></Layout> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Layout user={user} onLogout={handleLogout}><ProfilePage /></Layout> : <Navigate to="/login" />} 
        />

        {/* HOME / ROOT */}
        <Route 
          path="/" 
          element={
            <Layout user={user} onLogout={handleLogout}>
              <div className="p-12 text-center">
                <h1 className="text-4xl font-bold mb-4">Welcome to Stress Companion</h1>
                <p className="text-muted-foreground">Your personal mental health assistant.</p>
              </div>
            </Layout>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}