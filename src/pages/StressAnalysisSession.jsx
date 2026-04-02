"use client";

import React, { useEffect } from "react";
import SetupPage from "@/components/features/setup/SetupPage";
import ChatPage from "@/components/features/chat/ChatPage";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/store/useSessionStore";
import { useUIStore } from "@/store/useUIStore";
import { useVisionStore } from "@/store/useVisionStore";
import { useAuthStore } from "@/store/useAuthStore";
import { Navigate, useLocation } from "react-router-dom";

export default function StressAnalysisSession() {

  
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected. This allows us to send them
    // along to that page after they login, which is a nicer user experience.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }


  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const resetSessionStore = useSessionStore((state) => state.resetSessionStore);
  const resetUIStore = useUIStore((state) => state.resetUIStore);
  const resetVisionStore = useVisionStore((state) => state.resetVisionStore);

  useEffect(() => {
    return () => {
      resetSessionStore();
      resetUIStore();
      resetVisionStore();
    };
  }, [resetSessionStore, resetUIStore, resetVisionStore]);

  if (sessionStatus === "setup") {
    return (
      <Layout user={user} onLogout={logout}>
        <SetupPage />
      </Layout>
    );
  }

  if (sessionStatus === "ready" || sessionStatus === "preparing" || sessionStatus === "active") {
    return <ChatPage user={user} onLogout={logout} />;
  }

  if (sessionStatus === "completed") {
    return null;
  }

  return null;
}
