"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/features/chat/ChatLayout";
import { Navbar } from "@/components/layout/Navbar";

// Components
import VoicePanel from "@/components/features/chat/VoicePanel";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";
import { CameraStack } from "@/components/features/chat/CameraStack";

// Hooks
import { useChatSession } from "@/hooks/useChatSession";

export default function ChatPage({ user, onLogout }) {
  // --- 1. LOCAL UI STATE (Visual Toggles) ---
  const [isNormalCamOpen, setIsNormalCamOpen] = useState(false);
  const [isThermalCamOpen, setIsThermalCamOpen] = useState(false);
  
  // NEW: State for the transcript/chat panel visibility
  const [showTranscript, setShowTranscript] = useState(true);

  // --- 2. CORE LOGIC (The "Central Brain") ---
  const {
    messages,
    input,
    setInput,
    aiState,      
    hasStarted,   
    isMicOn,
    isSpeaking,
    isGeminiLoading,
    handleStartSession,
    handleSendMessage,
    toggleMic,
    handleStop,
  } = useChatSession();

  // --- 3. HELPER HANDLERS ---
  
  // Logic: If any camera is hidden, show both. If both are visible, hide both.
  const toggleCamera = () => {
    if (isNormalCamOpen || isThermalCamOpen) {
      setIsNormalCamOpen(false);
      setIsThermalCamOpen(false);
    } else {
      setIsNormalCamOpen(true);
      setIsThermalCamOpen(true);
    }
  };

  // Logic: Simple toggle for the side chat panel
  const toggleTranscript = () => {
    setShowTranscript((prev) => !prev);
  };

  // --- 4. PREPARE THE SLOTS ---

  // A. Camera Slot
  const cameraSlot = (
    <CameraStack
      isNormalOpen={isNormalCamOpen}
      isThermalOpen={isThermalCamOpen}
      onCloseNormal={() => setIsNormalCamOpen(false)}
      onCloseThermal={() => setIsThermalCamOpen(false)}
    />
  );

  // B. Voice Slot (The "Face" of the AI)
  const voiceSlot = (
    <VoicePanel
      hasStarted={hasStarted}
      aiState={aiState}
      
      // State booleans
      isMicOn={isMicOn}
      isGeminiLoading={isGeminiLoading}
      isSpeaking={isSpeaking}
      
      // UI States for buttons
      isChatOpen={showTranscript}           // Controls the "Maximize/Chat" icon state
      isCameraActive={isNormalCamOpen || isThermalCamOpen} // Controls the Camera button active state
      
      // Actions
      onStart={handleStartSession}
      onStop={handleStop}
      onToggleMic={toggleMic}
      
      // NEW: Wired up handlers
      onToggleChat={toggleTranscript}       // Wired to the top-right button
      onToggleCamera={toggleCamera}         // Wired to the footer camera button
    />
  );

  // C. Transcript Slot (The "Memory" of the AI)
  const transcriptSlot = (
    <ConversationPanel
      messages={messages}
      input={input}
      setInput={setInput}
      onSendMessage={handleSendMessage}
      hasStarted={hasStarted}
    />
  );

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <Navbar user={user} onLogout={onLogout} />

      <main className="flex-1 overflow-hidden border-t w-full">
        <ChatLayout
          // Control panel visibility based on state
          showCameraPanel={isNormalCamOpen || isThermalCamOpen}
          showTranscriptPanel={showTranscript}
          
          // Inject the slots
          cameraSlot={cameraSlot}
          voiceSlot={voiceSlot}
          transcriptSlot={transcriptSlot}
        />
      </main>
    </div>
  );
}