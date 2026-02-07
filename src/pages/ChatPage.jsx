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
import { ThermalFeed } from "@/components/features/chat/ThermalFeed";

// Hooks
import { useChatSession } from "@/hooks/useChatSession";

/**
 * HIDDEN LOGIC UNIT
 * Purpose: Keeps the "Master" DOM elements alive for the AI Trackers.
 */
function HiddenCameraUnit({ 
  opticalRef, opticalCanvasRef, 
  thermalRef, thermalCanvasRef, thermalStream 
}) {
  return (
    <div className="fixed top-0 left-0 invisible pointer-events-none overflow-hidden w-px h-px">
      {/* --- MASTER OPTICAL ELEMENT --- */}
      <video 
        ref={opticalRef} 
        autoPlay 
        playsInline 
        muted 
      />
      <canvas ref={opticalCanvasRef} />

      {/* --- MASTER THERMAL ELEMENT --- */}
      {thermalStream && (
        <img 
          ref={thermalRef} 
          src={thermalStream} 
          crossOrigin="anonymous"
          alt="hidden-thermal-master"
        />
      )}
      <canvas ref={thermalCanvasRef} />
    </div>
  );
}

export default function ChatPage({ user, onLogout }) {
  // --- 1. LOCAL UI STATE ---
  const [isOpticalCamOpen, setIsOpticalCamOpen] = useState(false);
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
    
    // Vision State bundles
    cameraProps,   // Optical Data
    thermalProps,  // Thermal Data
    
    // Actions
    handleStartSession,
    handleSendMessage,
    toggleMic,
    handleStop,
  } = useChatSession();

  // --- 3. HELPER HANDLERS ---
  const toggleCamera = () => {
    // If ANY camera is open, we close ALL.
    // If ALL are closed, we open BOTH.
    const isAnyOpen = isOpticalCamOpen || isThermalCamOpen;
    
    if (isAnyOpen) {
      setIsOpticalCamOpen(false);
      setIsThermalCamOpen(false);
    } else {
      setIsOpticalCamOpen(true);
      setIsThermalCamOpen(true);
    }
  };

  const toggleTranscript = () => {
    setShowTranscript((prev) => !prev);
  };

  // --- 4. PREPARE THE SLOTS ---

  // A. Camera Slot (The Visible UI)
  const cameraSlot = (
    <CameraStack
      // Visibility Toggles
      isOpticalOpen={isOpticalCamOpen}
      isThermalOpen={isThermalCamOpen}
      onCloseOptical={() => setIsOpticalCamOpen(false)}
      onCloseThermal={() => setIsThermalCamOpen(false)}
      
      // Optical Status
      isOpticalFeedLoading={cameraProps.isLoading}
      isOpticalFeedConnected={cameraProps.isConnected}

      // Thermal Status (Added as requested)
      isThermalFeedLoading={thermalProps.isLoading}
      isThermalFeedConnected={thermalProps.isConnected}
      
      // Slot 1: Optical Feed
      opticalFeedSlot={
        <OpticalFeed
          stream={cameraProps.stream} 
          overlayRef={cameraProps.overlayRef} 
          isActive={cameraProps.isActive}
          isLoading={cameraProps.isLoading}
          isConnected={cameraProps.isConnected}
          error={cameraProps.error}
        />
      }

      // Slot 2: Thermal Feed
      thermalFeedSlot={
        <ThermalFeed
          stream={thermalProps.stream} 
          overlayRef={thermalProps.overlayRef}
          isActive={thermalProps.isActive}
          isLoading={thermalProps.isLoading}
          error={thermalProps.error}
        />
      }
    />
  );

  // B. Voice Slot
  // Note: We ensure isCameraActive is true if EITHER camera is open.
  // This ensures the session timer continues counting even if one camera is closed.
  const voiceSlot = (
    <VoicePanel
      hasStarted={hasStarted}
      aiState={aiState}
      isMicOn={isMicOn}
      isGeminiLoading={isGeminiLoading}
      isSpeaking={isSpeaking}
      isChatOpen={showTranscript} 
      isCameraActive={isOpticalCamOpen || isThermalCamOpen} 
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
          // Optical
          opticalRef={cameraProps.masterVideoRef} 
          opticalCanvasRef={cameraProps.cropCanvasRef} 
          
          // Thermal
          thermalRef={thermalProps.masterVideoRef}
          thermalCanvasRef={thermalProps.cropCanvasRef}
          thermalStream={thermalProps.stream}
        />
      )}

      {/* 2. VISIBLE UI LAYER */}
      <div className="flex flex-col h-screen w-full bg-background">
        <Navbar user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-hidden border-t w-full">
          <ChatLayout
            showCameraPanel={isOpticalCamOpen || isThermalCamOpen}
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