"use client";

import React, { useEffect } from "react";
import SetupPage from "@/components/features/setup/SetupPage";
import ChatPage from "@/components/features/chat/ChatPage";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/store/useSessionStore";
import { useUIStore } from "@/store/useUIStore";
import { useVisionStore } from "@/store/useVisionStore";

export default function StressAnalysisSession({ user, onLogout }) {
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
      <Layout user={user} onLogout={onLogout}>
        <SetupPage />
      </Layout>
    );
  }

  if (sessionStatus === "ready" || sessionStatus === "preparing" || sessionStatus === "active") {
    return <ChatPage user={user} onLogout={onLogout} />;
  }

  if (sessionStatus === "completed") {
    return null;
  }

  return null;
}
