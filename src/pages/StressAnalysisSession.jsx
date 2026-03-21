"use client";

import React from "react";
import SetupPage from "@/components/features/setup/SetupPage";
import ChatPage from "@/components/features/chat/ChatPage";
import { Layout } from "@/components/layout/Layout";
import { useSessionStore } from "@/store/useSessionStore";

export default function StressAnalysisSession({ user, onLogout }) {
  const sessionStatus = useSessionStore((state) => state.sessionStatus);

  if (sessionStatus === "setup") {
    return (
      <Layout user={user} onLogout={onLogout}>
        <SetupPage />
      </Layout>
    );
  }

  if (sessionStatus === "active") {
    return <ChatPage user={user} onLogout={onLogout} />;
  }

  if (sessionStatus === "completed") {
    return null;
  }

  return null;
}
