// src/pages/StressSessionManager.jsx
"use client";

import React, { useState } from "react";
import SetupPage from "@/components/features/setup/SetupPage";
import ChatPage from "@/components/features/chat/ChatPage";
import { Layout } from "@/components/layout/Layout"; // <-- Import Layout

export default function StressSessionManager({ user, onLogout }) {
  const [sessionConfig, setSessionConfig] = useState(null);

  if (!sessionConfig) {
    // Wrap Setup in Layout so the header/sidebar still shows up!
    return (
      <Layout user={user} onLogout={onLogout}>
        <SetupPage onComplete={(data) => setSessionConfig(data)} />
      </Layout>
    );
  }

  // ChatPage renders fullscreen, no Layout wrapper needed here
  return (
    <ChatPage 
      user={user} 
      onLogout={onLogout} 
      setupData={sessionConfig} 
    />
  );
}