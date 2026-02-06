"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/features/chat/ChatLayout";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

// Components
import VoicePanel from "@/components/features/chat/VoicePanel";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";
import { CameraStack } from "@/components/features/chat/CameraStack";
import { OpticalFeed } from "@/components/features/chat/OpticalFeed";

// Hooks
import { useChatSession } from "@/hooks/useChatSession";

/**
 * HIDDEN LOGIC UNIT
 * Optimization: Removed hardcoded resolution. The video element will now
 * naturally adopt the stream's dimensions (e.g., 640x480) ensuring 1:1 pixel mapping
 * for the AI model without distortion.
 */
function HiddenCameraUnit({ videoRef, cropCanvasRef }) {
  return (
    <div className="fixed top-0 left-0 invisible pointer-events-none">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        // No width/height attributes here -> uses native stream size
      />
      {/* The canvas used for smart-cropping the face */}
      <canvas ref={cropCanvasRef} />
    </div>
  );
}

export default function ChatPage({ user, onLogout }) {
  // --- 1. LOCAL UI STATE ---
  const [isNormalCamOpen, setIsNormalCamOpen] = useState(false);
  const [isThermalCamOpen, setIsThermalCamOpen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  // --- 2. CORE LOGIC (Central Brain) ---
  const {
    // Chat Data
    messages,
    input,
    setInput,
    
    // Session State
    aiState,
    hasStarted,
    
    // Audio State
    isMicOn,
    isSpeaking,
    isGeminiLoading,
    
    // Vision State
    cameraProps, 
    
    // Actions
    handleStartSession,
    handleSendMessage,
    toggleMic,
    handleStop,
  } = useChatSession();

  // --- 3. HELPER HANDLERS ---
  const toggleCamera = () => {
    // Toggle both for simplicity, or manage individually based on preference
    const newState = !(isNormalCamOpen || isThermalCamOpen);
    setIsNormalCamOpen(newState);
    setIsThermalCamOpen(newState);
  };

  const toggleTranscript = () => {
    setShowTranscript((prev) => !prev);
  };

  // --- 4. PREPARE THE SLOTS ---

  // A. Camera Slot (The Visible UI)
  const cameraSlot = (
    <CameraStack
      isNormalOpen={isNormalCamOpen}
      isThermalOpen={isThermalCamOpen}
      onCloseNormal={() => setIsNormalCamOpen(false)}
      onCloseThermal={() => setIsThermalCamOpen(false)}
      opticalFeedSlot={
        <OpticalFeed
          // Visuals: The Shared Stream
          stream={cameraProps.stream} 
          
          // UI Overlay: The Green Box canvas ref (only draws when this component is mounted)
          overlayRef={cameraProps.overlayRef} 
          
          // Status
          isActive={cameraProps.isActive}
          isLoading={cameraProps.isLoading}
          isConnected={cameraProps.isConnected}
          error={cameraProps.error}
        />
      }
    />
  );

  // B. Voice Slot
  const voiceSlot = (
    <VoicePanel
      hasStarted={hasStarted}
      aiState={aiState}
      isMicOn={isMicOn}
      isGeminiLoading={isGeminiLoading}
      isSpeaking={isSpeaking}
      isChatOpen={showTranscript} 
      isCameraActive={isNormalCamOpen || isThermalCamOpen} 
      onStart={handleStartSession}
      onStop={handleStop}
      onToggleMic={toggleMic}
      onToggleChat={toggleTranscript} 
      onToggleCamera={toggleCamera} 
    />
  );

  // C. Transcript Slot
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
    <>
      {/* 1. HIDDEN LOGIC LAYER (Active when session starts) */}
      {hasStarted && (
        <HiddenCameraUnit 
          videoRef={cameraProps.masterVideoRef} 
          cropCanvasRef={cameraProps.cropCanvasRef} 
        />
      )}

      {/* 2. VISIBLE UI LAYER */}
      <div className="flex flex-col h-screen w-full bg-background">
        <Navbar user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-hidden border-t w-full">
          <ChatLayout
            showCameraPanel={isNormalCamOpen || isThermalCamOpen}
            showTranscriptPanel={showTranscript}
            cameraSlot={cameraSlot}
            voiceSlot={voiceSlot}
            transcriptSlot={transcriptSlot}
          />
        </main>
      </div>
      <Toaster />
    </>
  );
}