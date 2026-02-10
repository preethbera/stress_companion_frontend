import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 
import { toast } from "sonner";

// --- HOOK IMPORTS ---
import { useGemini } from "@/hooks/useGemini"; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";
import { useOpticalCamera } from "@/hooks/useOpticalCamera";
import { useOpticalStressSocket } from "@/hooks/useOpticalStressSocket";
import { useThermalCamera } from "@/hooks/useThermalCamera";
import { useThermalStressSocket } from "@/hooks/useThermalStressSocket";

const OPTICAL_FPS_RATE = 3;
const THERMAL_FPS_RATE = 3;

export function useChatSession() {
  const navigate = useNavigate();

  // ============================================================
  // 1. CORE STATE
  // ============================================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle"); 
  
  // PERFORMANCE: Use Refs for high-frequency data
  const stressTimelineRef = useRef([]);
  const thermalTimelineRef = useRef([]);
  
  // UI STATE: Throttled data for graphs
  const [liveStressScore, setLiveStressScore] = useState(null);

  const hasStartedRef = useRef(false);
  const isVisionActive = hasStarted;

  // ============================================================
  // 2. AI MODEL
  // ============================================================
  const { detectorRef, isModelLoaded, modelError } = useFaceDetection();

  // ============================================================
  // 3. CAMERAS
  // ============================================================
  
  // OPTICAL CAMERA
  const { 
    videoRef: opticalVideoRef, 
    stream: opticalStream,
    error: opticalError, 
    isLoading: isOpticalLoading 
  } = useOpticalCamera({ isActive: isVisionActive });

  // THERMAL CAMERA
  const {
    videoRef: thermalVideoRef,
    stream: thermalStream,
    error: thermalError,
    isLoading: isThermalLoading
  } = useThermalCamera({ isActive: isVisionActive });


  // ============================================================
  // 4. SOCKET GATEKEEPING
  // ============================================================
  // Only connect socket if: Vision is Active AND Camera is Streamable AND No Errors AND Not Loading
  const shouldConnectOptical = isVisionActive && !!opticalStream && !opticalError && !isOpticalLoading;
  const shouldConnectThermal = isVisionActive && !!thermalStream && !thermalError && !isThermalLoading;


  // ============================================================
  // 5. SOCKET HANDLERS (UPDATED FOR NEW BACKEND DATA)
  // ============================================================
  
  const handleOpticalMessage = useCallback((data) => {
    // Backend sends: { stress_probability: 0.0 - 1.0 }
    if (data?.stress_probability !== undefined) {
      // CLIENT-SIDE CALCULATION: Convert Prob to Score (0-100)
      const score = Math.round(data.stress_probability * 100);

      stressTimelineRef.current.push({ 
        timestamp: Date.now(), 
        score: score 
      });
    }
  }, []);

  const handleThermalMessage = useCallback((data) => {
    // Backend sends: { stress_probability: 0.0 - 1.0 }
    if (data?.stress_probability !== undefined) {
      // CLIENT-SIDE CALCULATION: Convert Prob to Boolean (Threshold > 0.5)
      const isStressed = data.stress_probability > 0.5;

      thermalTimelineRef.current.push({ 
        timestamp: Date.now(), 
        prob: data.stress_probability,
        isStressed: isStressed 
      });
    }
  }, []);

  // Initialize Sockets
  const { sendFrame: sendOpticalFrame, status: opticalStatus } = useOpticalStressSocket(
    shouldConnectOptical, 
    handleOpticalMessage 
  );

  const { sendFrame: sendThermalFrame, status: thermalStatus } = useThermalStressSocket(
    shouldConnectThermal,
    handleThermalMessage
  );

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
  const shouldTrackOptical = shouldConnectOptical && isModelLoaded && opticalStatus === "connected";
  
  const { overlayRef: opticalOverlayRef, cropCanvasRef: opticalCropRef } = useFaceTracker(
    opticalVideoRef,       
    detectorRef.current, 
    shouldTrackOptical,         
    sendOpticalFrame,
    OPTICAL_FPS_RATE        
  );

  // --- THERMAL TRACKER ---
  const shouldTrackThermal = shouldConnectThermal && isModelLoaded && thermalStatus === "connected";

  const { overlayRef: thermalOverlayRef, cropCanvasRef: thermalCropRef } = useFaceTracker(
    thermalVideoRef,
    detectorRef.current,
    shouldTrackThermal,
    sendThermalFrame,
    THERMAL_FPS_RATE
  );


  // ============================================================
  // 8. DATA BUNDLING
  // ============================================================

  const visionState = useMemo(() => ({
    isActive: isVisionActive,
    status: opticalStatus, 
    isConnected: opticalStatus === "connected",
    isLoading: isVisionActive && (isOpticalLoading || opticalStatus === "connecting"),
    error: opticalError || modelError,
    stream: opticalStream,       
    overlayRef: opticalOverlayRef,    
    cropCanvasRef: opticalCropRef,
    masterVideoRef: opticalVideoRef 
  }), [isVisionActive, opticalStatus, isOpticalLoading, opticalError, modelError, opticalStream, opticalOverlayRef, opticalCropRef, opticalVideoRef]);

  const thermalState = useMemo(() => ({
    isActive: isVisionActive,
    status: thermalStatus,
    isConnected: thermalStatus === "connected",
    isLoading: isVisionActive && (isThermalLoading || thermalStatus === "connecting"),
    error: thermalError,
    stream: thermalStream,
    overlayRef: thermalOverlayRef,
    cropCanvasRef: thermalCropRef,
    masterVideoRef: thermalVideoRef 
  }), [isVisionActive, thermalStatus, isThermalLoading, thermalError, thermalStream, thermalOverlayRef, thermalCropRef, thermalVideoRef]);


  // ============================================================
  // 9. AUDIO & INTELLIGENCE
  // ============================================================
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { isMicOn, startListening, stopListening, toggleMic } = useSpeechRecognition({
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
  // 10. ACTION HANDLERS
  // ============================================================

  const handleStop = useCallback(() => {
    cancelSpeech();   
    stopListening();  
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;

    // SAVE DATA
    const finalOpticalData = stressTimelineRef.current;
    const finalThermalData = thermalTimelineRef.current;

    if (finalOpticalData.length > 0 || finalThermalData.length > 0) {
      const sessionData = {
        optical: finalOpticalData,
        thermal: finalThermalData,
        timestamp: Date.now()
      };
      sessionStorage.setItem("lastSessionData", JSON.stringify(sessionData));
    }
    navigate("/report");
  }, [cancelSpeech, stopListening, navigate]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    
    // Reset Data
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

  // Automation Effects
  useEffect(() => { if (isMicOn && aiState === "idle") setAiState("listening"); }, [isMicOn, aiState]);
  useEffect(() => {
    if (!isMicOn && input.trim() && hasStarted && aiState === "idle" && !isGeminiLoading) {
      handleSendMessage();
    }
  }, [isMicOn, input, hasStarted, aiState, isGeminiLoading, handleSendMessage]);

  return {
    messages, input, setInput, aiState, hasStarted, isMicOn,
    isSpeaking: aiState === "speaking", isGeminiLoading,
    liveStressScore, 
    
    cameraProps: visionState,    
    thermalProps: thermalState,  
    
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  };
}