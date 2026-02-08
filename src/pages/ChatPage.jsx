"use client";

import React, { useState } from "react";
import ChatLayout from "@/components/features/chat/ChatLayout";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";

// Components
import VoicePanel from "@/components/features/chat/VoicePanel";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";
import { CameraStack } from "@/components/features/chat/CameraStack"; // Ensure this path is correct
import { OpticalFeed } from "@/components/features/chat/OpticalFeed";
import { ThermalFeed } from "@/components/features/chat/ThermalFeed";

// Hooks
import { useChatSession } from "@/hooks/useChatSession";

/**
 * HIDDEN LOGIC UNIT
 * Keeps the "Master" DOM elements alive for the AI Trackers.
 */
function HiddenCameraUnit({ 
  opticalRef, opticalCanvasRef, 
  thermalRef, thermalCanvasRef, thermalStream 
}) {
  return (
    <div className="fixed top-0 left-0 invisible pointer-events-none overflow-hidden w-px h-px">
      <video ref={opticalRef} autoPlay playsInline muted />
      <canvas ref={opticalCanvasRef} />
      {thermalStream && (
        <img ref={thermalRef} src={thermalStream} crossOrigin="anonymous" alt="hidden-thermal" />
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

  // --- 2. CORE LOGIC ---
  const {
    messages, input, setInput,
    aiState, hasStarted,
    isMicOn, isSpeaking, isGeminiLoading,
    cameraProps, thermalProps,
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  } = useChatSession();

  // --- 3. HELPER HANDLERS ---
  const toggleCamera = () => {
    const isAnyOpen = isOpticalCamOpen || isThermalCamOpen;
    if (isAnyOpen) {
      setIsOpticalCamOpen(false);
      setIsThermalCamOpen(false);
    } else {
      setIsOpticalCamOpen(true);
      setIsThermalCamOpen(true);
    }
  };

  const toggleTranscript = () => setShowTranscript((prev) => !prev);

  // --- 4. PREPARE SLOTS ---

  const cameraSlot = (
    <CameraStack
      // Toggles
      isOpticalOpen={isOpticalCamOpen}
      isThermalOpen={isThermalCamOpen}
      onCloseOptical={() => setIsOpticalCamOpen(false)}
      onCloseThermal={() => setIsThermalCamOpen(false)}
      
      // Status Props (These drive the Badge)
      isOpticalFeedLoading={cameraProps.isLoading}
      isOpticalFeedConnected={cameraProps.isConnected}
      
      isThermalFeedLoading={thermalProps.isLoading}
      isThermalFeedConnected={thermalProps.isConnected}
      
      // Feed Components
      opticalFeedSlot={
        <OpticalFeed
          stream={cameraProps.stream} 
          overlayRef={cameraProps.overlayRef} 
          isActive={cameraProps.isActive}
          isLoading={cameraProps.isLoading}
          error={cameraProps.error}
        />
      }
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
      {hasStarted && (
        <HiddenCameraUnit 
          opticalRef={cameraProps.masterVideoRef} 
          opticalCanvasRef={cameraProps.cropCanvasRef} 
          thermalRef={thermalProps.masterVideoRef}
          thermalCanvasRef={thermalProps.cropCanvasRef}
          thermalStream={thermalProps.stream}
        />
      )}

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