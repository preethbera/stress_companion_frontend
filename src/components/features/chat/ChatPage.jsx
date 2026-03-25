"use client";

import React, { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import ChatLayout from "@/components/features/chat/ChatLayout";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

import VoicePanel from "@/components/features/chat/VoicePanel";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";
import { CameraStack } from "@/components/features/chat/CameraStack";

// The Decoupled Hooks
import { useChatSession } from "@/hooks/useChatSession";
import { useVisionPipeline } from "@/hooks/useVisionPipeline";

import { CAMERA_CONFIG } from "@/config/constants";

export default function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

  // 2. Data Storage for Report Generation
  const stressTimelineRef = useRef([]);
  const thermalTimelineRef = useRef([]);

  // 3. Audio / Conversational Agent Engine
  const chatProps = useChatSession();

  // 4. Vision Engine Data Handlers
  const handleOpticalData = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      toast.dismiss("vision-warning"); // Clear the warning when face returns
      stressTimelineRef.current.push({
        timestamp: Date.now(),
        score: Math.round(data.stress_probability * 100),
        status: "FACE_DETECTED",
      });
    } else if (data?.status === "NO_FACE") {
      toast.error("Face not detected. Please look at the camera.", { id: "vision-warning", duration: 1000 });
      stressTimelineRef.current.push({
        timestamp: Date.now(),
        score: null,
        status: "NO_FACE",
      });
    } else if (data?.status === "MULTIPLE_FACES") {
      toast.error("Multiple faces detected. Please ensure only you are in the frame.", { id: "vision-warning", duration: 1000 });
      stressTimelineRef.current.push({
        timestamp: Date.now(),
        score: null,
        status: "NO_FACE", // Log as a gap in the timeline
      });
    }
  }, []);

  const handleThermalData = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      toast.dismiss("vision-warning"); // Clear the warning when face returns
      thermalTimelineRef.current.push({
        timestamp: Date.now(),
        prob: data.stress_probability,
        isStressed: data.stress_probability > 0.5,
        status: "FACE_DETECTED",
      });
    } else if (data?.status === "NO_FACE") {
      toast.error("Face not detected. Please look at the camera.", { id: "optical-vision-warning", duration: 1000 });
      thermalTimelineRef.current.push({
        timestamp: Date.now(),
        prob: null,
        status: "NO_FACE",
      });
    } else if (data?.status === "MULTIPLE_FACES") {
      toast.error("Multiple faces detected. Please ensure only you are in the frame.", { id: "thermal-vision-warning", duration: 1000 });
      thermalTimelineRef.current.push({
        timestamp: Date.now(),
        prob: null,
        status: "NO_FACE", // Log as a gap in the timeline
      });
    }
  }, []);

  useVisionPipeline({
    cameraId: "optical", // The logical UI slot
    endpointName: "optical",
    onDataReceived: handleOpticalData,
    targetFps: CAMERA_CONFIG.OPTICAL_FPS_RATE,
  });

  useVisionPipeline({
    cameraId: "thermal",
    endpointName: "thermal",
    onDataReceived: handleThermalData,
    targetFps: CAMERA_CONFIG.THERMAL_FPS_RATE,
  });

  const handleStopSession = () => {
    // Collect timelines from refs before halting
    const finalOpticalData = stressTimelineRef.current;
    const finalThermalData = thermalTimelineRef.current;

    // Clear any lingering vision toasts on exit
    toast.dismiss("vision-warning");

    if (finalOpticalData.length > 0 || finalThermalData.length > 0) {
      sessionStorage.setItem(
        "lastSessionData",
        JSON.stringify({
          optical: finalOpticalData,
          thermal: finalThermalData,
          timestamp: Date.now(),
        }),
      );
    }
    chatProps.handleStop();
    navigate("/report");
  };

  return (
    <>
      <div className="flex flex-col h-screen w-full bg-background">
        <Navbar user={user} onLogout={onLogout} />
        <main className="flex-1 overflow-hidden border-t w-full">
          <ChatLayout
            cameraSlot={<CameraStack />}
            voiceSlot={
              <VoicePanel
                aiState={chatProps.aiState}
                isMicOn={chatProps.isMicOn}
                isUserSpeaking={chatProps.isUserSpeaking}
                onStop={handleStopSession}
                onToggleMic={chatProps.toggleMic}
              />
            }
            transcriptSlot={
              <ConversationPanel
                messages={chatProps.messages}
                input={chatProps.input}
                setInput={chatProps.setInput}
                onSendMessage={chatProps.handleSendMessage}
              />
            }
          />
        </main>
      </div>
      <Toaster position="top-center"/>
    </>
  );
}