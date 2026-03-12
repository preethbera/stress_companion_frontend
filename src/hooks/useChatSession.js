import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useGemini } from "@/hooks/useGemini";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";
import { useWebcamStream } from "@/hooks/useWebcamStream";
import { useStressSocket } from "@/hooks/useStressSocket";
import { CAMERA_CONFIG } from "@/config/constants";

export function useChatSession(setupData = {}) {
  const navigate = useNavigate();

  const {
    micDeviceId,
    opticalDeviceId,
    optOutOptical,
    thermalDeviceId,
    optOutThermal,
  } = setupData;

  // ============================================================
  // 1. CORE STATE & STORAGE
  // ============================================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle");
  const [liveStressScore, setLiveStressScore] = useState(null);

  // Data storage for the final report
  const stressTimelineRef = useRef([]);
  const thermalTimelineRef = useRef([]);

  const hasStartedRef = useRef(false);
  const isVisionActive = hasStarted;

  // ============================================================
  // 2. AI MODELS & CAMERAS
  // ============================================================
  const { detectorRef: opticalDetector, isModelLoaded: isOpticalLoaded, modelError: opticalModelError } = useFaceDetection();
  const { detectorRef: thermalDetector, isModelLoaded: isThermalLoaded, modelError: thermalModelError } = useFaceDetection();

  const { videoRef: opticalVideoRef, stream: opticalStream, error: opticalError, isLoading: isOpticalLoading } = useWebcamStream(opticalDeviceId, optOutOptical, isVisionActive);
  const { videoRef: thermalVideoRef, stream: thermalStream, error: thermalError, isLoading: isThermalLoading } = useWebcamStream(thermalDeviceId, optOutThermal, isVisionActive);

  // ============================================================
  // 3. SOCKET WEBSOCKETS
  // ============================================================
  const shouldConnectOptical = !optOutOptical && isVisionActive && !!opticalStream && !opticalError && !isOpticalLoading;
  const shouldConnectThermal = !optOutThermal && isVisionActive && !!thermalStream && !thermalError && !isThermalLoading;

  // When backend returns a score, log it as a successful detection
  const handleOpticalMessage = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      stressTimelineRef.current.push({ 
        timestamp: Date.now(), 
        score: Math.round(data.stress_probability * 100),
        status: "FACE_DETECTED" 
      });
    }
  }, []);

  const handleThermalMessage = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      thermalTimelineRef.current.push({
        timestamp: Date.now(),
        prob: data.stress_probability,
        isStressed: data.stress_probability > 0.5,
        status: "FACE_DETECTED"
      });
    }
  }, []);

  const { sendFrame: sendOpticalFrame, status: opticalStatus } = useStressSocket("optical", shouldConnectOptical, handleOpticalMessage);
  const { sendFrame: sendThermalFrame, status: thermalStatus } = useStressSocket("thermal", shouldConnectThermal, handleThermalMessage);

  // ============================================================
  // 4. SMART FRAME ROUTERS (Handles the No Face / Multiple Face logic)
  // ============================================================
  
  const handleOpticalFrameCapture = useCallback((blob, status) => {
    if (status === "NO_FACE") {
      // Bypass the backend entirely and log the missing data point for the report
      stressTimelineRef.current.push({ timestamp: Date.now(), score: null, status: "NO_FACE" });
    } else if (status === "FACE_DETECTED" && blob) {
      // Face is locked and cropped, send to FastAPI
      sendOpticalFrame(blob);
    }
  }, [sendOpticalFrame]);

  const handleThermalFrameCapture = useCallback((blob, status) => {
    if (status === "NO_FACE") {
      thermalTimelineRef.current.push({ timestamp: Date.now(), prob: null, isStressed: null, status: "NO_FACE" });
    } else if (status === "FACE_DETECTED" && blob) {
      sendThermalFrame(blob);
    }
  }, [sendThermalFrame]);

  // ============================================================
  // 5. THROTTLED UI UPDATES (Displays the live score)
  // ============================================================
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      const opticalData = stressTimelineRef.current;
      if (opticalData.length > 0) {
        const lastEntry = opticalData[opticalData.length - 1];
        // Only update UI score if a face was actually detected
        if (lastEntry.status === "FACE_DETECTED") {
          setLiveStressScore(lastEntry.score);
        } else {
          setLiveStressScore(null); // Clear score if they look away
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [hasStarted]);

  // ============================================================
  // 6. TRACKERS
  // ============================================================
  const shouldTrackOptical = shouldConnectOptical && isOpticalLoaded && opticalStatus === "connected";
  const { overlayRef: opticalOverlayRef, cropCanvasRef: opticalCropRef } = useFaceTracker(
    opticalVideoRef,
    opticalDetector.current,
    shouldTrackOptical,
    handleOpticalFrameCapture, // 👈 Passing the smart router here
    CAMERA_CONFIG.OPTICAL_FPS_RATE
  );

  const shouldTrackThermal = shouldConnectThermal && isThermalLoaded && thermalStatus === "connected";
  const { overlayRef: thermalOverlayRef, cropCanvasRef: thermalCropRef } = useFaceTracker(
    thermalVideoRef,
    thermalDetector.current,
    shouldTrackThermal,
    handleThermalFrameCapture, // 👈 Passing the smart router here
    CAMERA_CONFIG.THERMAL_FPS_RATE
  );

  // ============================================================
  // 7. DATA BUNDLING
  // ============================================================
  const visionState = useMemo(() => ({
    isOptedOut: optOutOptical,
    isActive: isVisionActive,
    status: opticalStatus,
    isConnected: opticalStatus === "connected",
    isLoading: isVisionActive && (isOpticalLoading || opticalStatus === "connecting"),
    error: opticalError || opticalModelError,
    stream: opticalStream,
    overlayRef: opticalOverlayRef,
    cropCanvasRef: opticalCropRef,
    masterVideoRef: opticalVideoRef,
  }), [optOutOptical, isVisionActive, opticalStatus, isOpticalLoading, opticalError, opticalModelError, opticalStream, opticalOverlayRef, opticalCropRef, opticalVideoRef]);

  const thermalState = useMemo(() => ({
    isOptedOut: optOutThermal,
    isActive: isVisionActive,
    status: thermalStatus,
    isConnected: thermalStatus === "connected",
    isLoading: isVisionActive && (isThermalLoading || thermalStatus === "connecting"),
    error: thermalError || thermalModelError,
    stream: thermalStream,
    overlayRef: thermalOverlayRef,
    cropCanvasRef: thermalCropRef,
    masterVideoRef: thermalVideoRef,
  }), [optOutThermal, isVisionActive, thermalStatus, isThermalLoading, thermalError, thermalModelError, thermalStream, thermalOverlayRef, thermalCropRef, thermalVideoRef]);

  // ============================================================
  // 8. AUDIO & INTELLIGENCE
  // ============================================================
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { isMicOn, startListening, stopListening, toggleMic } = useSpeechRecognition({
    deviceId: micDeviceId,
    onResult: (transcript) => setInput(transcript),
    onEnd: () => setAiState((prev) => (prev === "thinking" ? "thinking" : "idle")),
  });

  const ttsOptions = useMemo(() => ({
    onSpeakStart: () => setAiState("speaking"),
    onSpeakEnd: () => {
      setAiState("idle");
      setTimeout(() => { if (hasStartedRef.current) startListening(); }, 200);
    },
  }), [startListening]);

  const { speak, cancelSpeech } = useTextToSpeech(ttsOptions);

  // ============================================================
  // 9. ACTION HANDLERS
  // ============================================================
  const handleStop = useCallback(() => {
    cancelSpeech();
    stopListening();
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;

    // Grab the final arrays from memory
    const finalOpticalData = stressTimelineRef.current;
    const finalThermalData = thermalTimelineRef.current;

    // Save them to the browser so the Report page can render them
    if (finalOpticalData.length > 0 || finalThermalData.length > 0) {
      const sessionData = {
        optical: finalOpticalData,
        thermal: finalThermalData,
        timestamp: Date.now(),
      };
      sessionStorage.setItem("lastSessionData", JSON.stringify(sessionData));
    }
    navigate("/report");
  }, [cancelSpeech, stopListening, navigate]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    stressTimelineRef.current = [];
    thermalTimelineRef.current = [];
    setLiveStressScore(null);

    const initialMsg = "I'm listening. You can speak freely here. How are you feeling?";
    setMessages([{ id: Date.now().toString(), role: "assistant", content: initialMsg }]);
    speak(initialMsg);
  }, [speak]);

  const handleSendMessage = useCallback(async (textOverride) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAiState("thinking");
    cancelSpeech();
    stopListening();

    try {
      const aiText = await sendMessage(textToSend);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: aiText }]);
      speak(aiText);
    } catch (error) {
      console.error("Failed to get response:", error);
      setAiState("idle");
    }
  }, [input, sendMessage, speak, cancelSpeech, stopListening]);

  useEffect(() => {
    if (isMicOn && aiState === "idle") setAiState("listening");
  }, [isMicOn, aiState]);
  
  useEffect(() => {
    if (!isMicOn && input.trim() && hasStarted && aiState === "idle" && !isGeminiLoading) {
      handleSendMessage();
    }
  }, [isMicOn, input, hasStarted, aiState, isGeminiLoading, handleSendMessage]);

  return {
    messages, input, setInput, aiState, hasStarted, isMicOn, isSpeaking: aiState === "speaking", isGeminiLoading, liveStressScore,
    cameraProps: visionState, thermalProps: thermalState,
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  };
}