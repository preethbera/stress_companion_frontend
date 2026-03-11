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


// Accept setupData as a parameter
export function useChatSession(setupData = {}) {
  const navigate = useNavigate();

  // Destructure hardware preferences
  const {
    micDeviceId,
    opticalDeviceId,
    optOutOptical,
    thermalDeviceId,
    optOutThermal,
  } = setupData;

  // ============================================================
  // 1. CORE STATE
  // ============================================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle");

  const stressTimelineRef = useRef([]);
  const thermalTimelineRef = useRef([]);

  const [liveStressScore, setLiveStressScore] = useState(null);

  const hasStartedRef = useRef(false);
  const isVisionActive = hasStarted;

  // ============================================================
  // 2. AI MODEL
  // ============================================================
  const {
    detectorRef: opticalDetector,
    isModelLoaded: isOpticalLoaded,
    modelError: opticalModelError,
  } = useFaceDetection();

  const {
    detectorRef: thermalDetector,
    isModelLoaded: isThermalLoaded,
    modelError: thermalModelError,
  } = useFaceDetection();

  // ============================================================
  // 3. CAMERAS (USING THE UNIFIED HOOK)
  // ============================================================

  const {
    videoRef: opticalVideoRef,
    stream: opticalStream,
    error: opticalError,
    isLoading: isOpticalLoading,
  } = useWebcamStream(opticalDeviceId, optOutOptical, isVisionActive);

  const {
    videoRef: thermalVideoRef,
    stream: thermalStream,
    error: thermalError,
    isLoading: isThermalLoading,
  } = useWebcamStream(thermalDeviceId, optOutThermal, isVisionActive);

  // ============================================================
  // 4. SOCKET GATEKEEPING
  // ============================================================
  // Strict check: User didn't opt out + Session Active + Stream Ready
  const shouldConnectOptical =
    !optOutOptical &&
    isVisionActive &&
    !!opticalStream &&
    !opticalError &&
    !isOpticalLoading;
  const shouldConnectThermal =
    !optOutThermal &&
    isVisionActive &&
    !!thermalStream &&
    !thermalError &&
    !isThermalLoading;

  // ============================================================
  // 5. SOCKET HANDLERS (USING THE UNIFIED HOOK)
  // ============================================================

  const handleOpticalMessage = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      const score = Math.round(data.stress_probability * 100);
      stressTimelineRef.current.push({ timestamp: Date.now(), score: score });
    }
  }, []);

  const handleThermalMessage = useCallback((data) => {
    if (data?.stress_probability !== undefined) {
      const isStressed = data.stress_probability > 0.5;
      thermalTimelineRef.current.push({
        timestamp: Date.now(),
        prob: data.stress_probability,
        isStressed: isStressed,
      });
    }
  }, []);

  const { sendFrame: sendOpticalFrame, status: opticalStatus } =
    useStressSocket("optical", shouldConnectOptical, handleOpticalMessage);

  const { sendFrame: sendThermalFrame, status: thermalStatus } =
    useStressSocket("thermal", shouldConnectThermal, handleThermalMessage);

  // ============================================================
  // 6. THROTTLED UI UPDATES
  // ============================================================
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(() => {
      const opticalData = stressTimelineRef.current;
      if (opticalData.length > 0) {
        setLiveStressScore(opticalData[opticalData.length - 1].score);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [hasStarted]);

  // ============================================================
  // 7. TRACKERS
  // ============================================================

  // --- OPTICAL TRACKER ---
  const shouldTrackOptical =
    shouldConnectOptical && isOpticalLoaded && opticalStatus === "connected";

  const { overlayRef: opticalOverlayRef, cropCanvasRef: opticalCropRef } =
    useFaceTracker(
      opticalVideoRef,
      opticalDetector.current, // Uses Optical Brain
      shouldTrackOptical,
      sendOpticalFrame,
      CAMERA_CONFIG.OPTICAL_FPS_RATE,
    );

  // --- THERMAL TRACKER ---
  const shouldTrackThermal =
    shouldConnectThermal && isThermalLoaded && thermalStatus === "connected";

  const { overlayRef: thermalOverlayRef, cropCanvasRef: thermalCropRef } =
    useFaceTracker(
      thermalVideoRef,
      thermalDetector.current, // Uses Thermal Brain
      shouldTrackThermal,
      sendThermalFrame,
      CAMERA_CONFIG.THERMAL_FPS_RATE,
    );

  // ============================================================
  // 8. DATA BUNDLING
  // ============================================================

  const visionState = useMemo(
    () => ({
      isOptedOut: optOutOptical, // Tell the UI if this was skipped
      isActive: isVisionActive,
      status: opticalStatus,
      isConnected: opticalStatus === "connected",
      isLoading:
        isVisionActive && (isOpticalLoading || opticalStatus === "connecting"),
      error: opticalError || opticalModelError,
      stream: opticalStream,
      overlayRef: opticalOverlayRef,
      cropCanvasRef: opticalCropRef,
      masterVideoRef: opticalVideoRef,
    }),
    [
      optOutOptical,
      isVisionActive,
      opticalStatus,
      isOpticalLoading,
      opticalError,
      opticalModelError,
      opticalStream,
      opticalOverlayRef,
      opticalCropRef,
      opticalVideoRef,
    ],
  );

  const thermalState = useMemo(
    () => ({
      isOptedOut: optOutThermal, // Tell the UI if this was skipped
      isActive: isVisionActive,
      status: thermalStatus,
      isConnected: thermalStatus === "connected",
      isLoading:
        isVisionActive && (isThermalLoading || thermalStatus === "connecting"),
      error: thermalError || thermalModelError,
      stream: thermalStream,
      overlayRef: thermalOverlayRef,
      cropCanvasRef: thermalCropRef,
      masterVideoRef: thermalVideoRef,
    }),
    [
      optOutThermal,
      isVisionActive,
      thermalStatus,
      isThermalLoading,
      thermalError,
      thermalModelError,
      thermalStream,
      thermalOverlayRef,
      thermalCropRef,
      thermalVideoRef,
    ],
  );

  // ============================================================
  // 9. AUDIO & INTELLIGENCE
  // ============================================================
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { isMicOn, startListening, stopListening, toggleMic } =
    useSpeechRecognition({
      deviceId: micDeviceId, // Pass the chosen mic to your speech hook!
      onResult: (transcript) => setInput(transcript),
      onEnd: () =>
        setAiState((prev) => (prev === "thinking" ? "thinking" : "idle")),
    });

  const ttsOptions = useMemo(
    () => ({
      onSpeakStart: () => setAiState("speaking"),
      onSpeakEnd: () => {
        setAiState("idle");
        setTimeout(() => {
          if (hasStartedRef.current) startListening();
        }, 200);
      },
    }),
    [startListening],
  );

  const { speak, cancelSpeech } = useTextToSpeech(ttsOptions);

  // ============================================================
  // 10. ACTION HANDLERS
  // ============================================================

  const handleStop = useCallback(() => {
    cancelSpeech();
    stopListening();
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;

    const finalOpticalData = stressTimelineRef.current;
    const finalThermalData = thermalTimelineRef.current;

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

    const initialMsg =
      "I'm listening. You can speak freely here. How are you feeling?";
    setMessages([
      { id: Date.now().toString(), role: "assistant", content: initialMsg },
    ]);
    speak(initialMsg);
  }, [speak]);

  const handleSendMessage = useCallback(
    async (textOverride) => {
      const textToSend =
        typeof textOverride === "string" ? textOverride : input;
      if (!textToSend.trim()) return;

      const userMsg = {
        id: Date.now().toString(),
        role: "user",
        content: textToSend,
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setAiState("thinking");
      cancelSpeech();
      stopListening();

      try {
        const aiText = await sendMessage(textToSend);
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: aiText,
          },
        ]);
        speak(aiText);
      } catch (error) {
        console.error("Failed to get response:", error);
        setAiState("idle");
      }
    },
    [input, sendMessage, speak, cancelSpeech, stopListening],
  );

  useEffect(() => {
    if (isMicOn && aiState === "idle") setAiState("listening");
  }, [isMicOn, aiState]);
  useEffect(() => {
    if (
      !isMicOn &&
      input.trim() &&
      hasStarted &&
      aiState === "idle" &&
      !isGeminiLoading
    ) {
      handleSendMessage();
    }
  }, [isMicOn, input, hasStarted, aiState, isGeminiLoading, handleSendMessage]);

  return {
    messages,
    input,
    setInput,
    aiState,
    hasStarted,
    isMicOn,
    isSpeaking: aiState === "speaking",
    isGeminiLoading,
    liveStressScore,

    cameraProps: visionState,
    thermalProps: thermalState,

    handleStartSession,
    handleSendMessage,
    toggleMic,
    handleStop,
  };
}
