"use client";

import React, { useState, useEffect } from "react";
import ChatLayout from "@/components/features/chat/ChatLayout";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { CameraOff } from "lucide-react"; 

// Components
import VoicePanel from "@/components/features/chat/VoicePanel";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";
import { CameraStack } from "@/components/features/chat/CameraStack"; 
import { CameraFeed } from "@/components/features/chat/CameraFeed";

// Hooks
import { useChatSession } from "@/hooks/useChatSession";

/**
 * HIDDEN LOGIC UNIT
 * Keeps the "Master" DOM elements alive for the AI Trackers.
 */
function HiddenCameraUnit({ 
  opticalRef, opticalCanvasRef, opticalStream,
  thermalRef, thermalCanvasRef, thermalStream
}) {
  // even if they mount a few milliseconds late. This stops the tracker from freezing.
  useEffect(() => {
    if (opticalRef?.current && opticalStream) {
      opticalRef.current.srcObject = opticalStream;
    }
  }, [opticalStream, opticalRef]);

  useEffect(() => {
    if (thermalRef?.current && thermalStream) {
      thermalRef.current.srcObject = thermalStream;
    }
  }, [thermalStream, thermalRef]);

  return (
    <div className="fixed top-0 left-0 pointer-events-none overflow-hidden opacity-0 w-10 h-10 z-[-10]">
      <video 
        ref={opticalRef} 
        autoPlay playsInline muted 
        onLoadedMetadata={(e) => e.target.play().catch(() => {})} 
        className="w-full h-full" 
      />
      <canvas ref={opticalCanvasRef} />
      <video 
        ref={thermalRef} 
        autoPlay playsInline muted 
        onLoadedMetadata={(e) => e.target.play().catch(() => {})} 
        className="w-full h-full" 
      />
      <canvas ref={thermalCanvasRef} />
    </div>
  );
}

export default function ChatPage({ user, onLogout, setupData }) {
  const [isOpticalCamOpen, setIsOpticalCamOpen] = useState(false);
  const [isThermalCamOpen, setIsThermalCamOpen] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);

  const {
    messages, input, setInput,
    aiState, hasStarted,
    isMicOn, isSpeaking, isGeminiLoading,
    cameraProps, thermalProps,
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  } = useChatSession(setupData);

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

  const renderDisabledCamera = (label) => (
    <div className="flex flex-col items-center justify-center h-full w-full bg-card rounded-xl border border-dashed border-border text-muted-foreground p-6">
      <CameraOff className="h-10 w-10 mb-3 opacity-40" />
      <p className="font-medium text-sm">{label}</p>
    </div>
  );

  const cameraSlot = (
    <CameraStack
      isOpticalOpen={isOpticalCamOpen}
      isThermalOpen={isThermalCamOpen}
      onCloseOptical={() => setIsOpticalCamOpen(false)}
      onCloseThermal={() => setIsThermalCamOpen(false)}
       
      // This stops the "Live" badge from showing up on skipped cameras.
      isOpticalFeedLoading={cameraProps.isOptedOut ? false : cameraProps.isLoading}
      isOpticalFeedConnected={cameraProps.isOptedOut ? false : cameraProps.isConnected}
      
      isThermalFeedLoading={thermalProps.isOptedOut ? false : thermalProps.isLoading}
      isThermalFeedConnected={thermalProps.isOptedOut ? false : thermalProps.isConnected}
      
      opticalFeedSlot={
        cameraProps.isOptedOut ? (
          renderDisabledCamera("Optical Camera Not Used")
        ) : (
          <CameraFeed
            title="Optical Camera"
            stream={cameraProps.stream} 
            overlayRef={cameraProps.overlayRef} 
            isActive={!cameraProps.isOptedOut}
            isLoading={cameraProps.isLoading}
            error={cameraProps.error}
          />
        )
      }
      thermalFeedSlot={
        thermalProps.isOptedOut ? (
          renderDisabledCamera("Thermal Camera Not Used")
        ) : (
          <CameraFeed
            title="Thermal Camera"
            stream={thermalProps.stream} 
            overlayRef={thermalProps.overlayRef}
            isActive={!thermalProps.isOptedOut}
            isLoading={thermalProps.isLoading}
            error={thermalProps.error}
          />
        )
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
          opticalStream={cameraProps.stream} 
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