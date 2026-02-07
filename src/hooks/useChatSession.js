import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom"; 

// --- HOOK IMPORTS ---
import { useGemini } from "@/hooks/useGemini"; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";

// Optical Hooks
import { useOpticalCamera } from "@/hooks/useOpticalCamera";
import { useOpticalStressSocket } from "@/hooks/useOpticalStressSocket";

// Thermal Hooks (New)
import { useThermalCamera } from "@/hooks/useThermalCamera";
import { useThermalStressSocket } from "@/hooks/useThermalStressSocket";

export function useChatSession() {
  const navigate = useNavigate();

  // ============================================================
  // 1. CORE STATE
  // ============================================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle"); 
  
  // Data Accumulators
  const [stressTimeline, setStressTimeline] = useState([]); 
  const [thermalTimeline, setThermalTimeline] = useState([]); // <--- NEW: Thermal Data

  const hasStartedRef = useRef(false);
  const isVisionActive = hasStarted;

  // ============================================================
  // 2. AI MODEL (Shared between both cameras)
  // ============================================================
  // We load the face detector once and pass it to both trackers.
  const { detectorRef, isModelLoaded, modelError } = useFaceDetection();


  // ============================================================
  // 3. OPTICAL SYSTEM (RGB Camera)
  // ============================================================
  
  // A. Socket Handler
  const handleOpticalMessage = useCallback((data) => {
    if (data?.stress_score !== undefined) {
      setStressTimeline((prev) => [
        ...prev, 
        { timestamp: Date.now(), score: data.stress_score }
      ]);
    }
  }, []);

  const { sendFrame: sendOpticalFrame, isConnected: isOpticalConnected } = useOpticalStressSocket(
    isVisionActive, 
    handleOpticalMessage 
  );

  // B. Camera
  const { 
    videoRef: opticalVideoRef, 
    stream: opticalStream,
    error: opticalError, 
    isLoading: isOpticalLoading 
  } = useOpticalCamera({ isActive: isVisionActive });

  // C. Tracker (Optical)
  // Only track if vision is active, model is loaded, and camera is ready
  const shouldTrackOptical = isVisionActive && isModelLoaded && !isOpticalLoading;

  const { overlayRef: opticalOverlayRef, cropCanvasRef: opticalCropRef } = useFaceTracker(
    opticalVideoRef,       
    detectorRef.current, 
    shouldTrackOptical,         
    sendOpticalFrame          
  );


  // ============================================================
  // 4. THERMAL SYSTEM (Infrared Camera) <--- NEW SECTION
  // ============================================================

  // A. Socket Handler
  const handleThermalMessage = useCallback((data) => {
    // Assuming data structure: { stress_probability: float, is_stressed: bool }
    if (data?.stress_probability !== undefined) {
      setThermalTimeline((prev) => [
        ...prev, 
        { 
          timestamp: Date.now(), 
          prob: data.stress_probability,
          isStressed: data.is_stressed 
        }
      ]);
    }
  }, []);

  const { sendFrame: sendThermalFrame, isConnected: isThermalConnected } = useThermalStressSocket(
    isVisionActive,
    handleThermalMessage
  );

  // B. Camera (Local Python Stream)
  const {
    videoRef: thermalVideoRef, // This attaches to an <img /> tag
    stream: thermalStream,     // This is a URL string
    error: thermalError,
    isLoading: isThermalLoading
  } = useThermalCamera({ isActive: isVisionActive });

  // C. Tracker (Thermal)
  // We reuse the SAME detectorRef. The Universal useFaceTracker handles the <img> tag.
  const shouldTrackThermal = isVisionActive && isModelLoaded && !isThermalLoading;

  const { overlayRef: thermalOverlayRef, cropCanvasRef: thermalCropRef } = useFaceTracker(
    thermalVideoRef,
    detectorRef.current,
    shouldTrackThermal,
    sendThermalFrame // Send cropped thermal face to backend
  );


  // ============================================================
  // 5. DATA BUNDLING (For UI)
  // ============================================================

  // Optical Props
  const visionState = useMemo(() => ({
    isActive: isVisionActive,
    isLoading: isVisionActive && (!isModelLoaded || isOpticalLoading),
    isConnected: isOpticalConnected,
    error: opticalError || modelError,
    stream: opticalStream,       
    overlayRef: opticalOverlayRef,    
    cropCanvasRef: opticalCropRef,
    masterVideoRef: opticalVideoRef 
  }), [isVisionActive, isModelLoaded, isOpticalLoading, isOpticalConnected, opticalError, modelError, opticalStream, opticalOverlayRef, opticalCropRef, opticalVideoRef]);

  // Thermal Props <--- NEW
  const thermalState = useMemo(() => ({
    isActive: isVisionActive,
    isLoading: isVisionActive && (!isModelLoaded || isThermalLoading),
    isConnected: isThermalConnected,
    error: thermalError, // Model error already reported in visionState
    stream: thermalStream,
    overlayRef: thermalOverlayRef,
    cropCanvasRef: thermalCropRef,
    masterVideoRef: thermalVideoRef // This will be passed to <ThermalFeed />
  }), [isVisionActive, isModelLoaded, isThermalLoading, isThermalConnected, thermalError, thermalStream, thermalOverlayRef, thermalCropRef, thermalVideoRef]);


  // ============================================================
  // 6. AUDIO & INTELLIGENCE CONFIGURATION
  // ============================================================

  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { 
    isMicOn, 
    startListening, 
    stopListening, 
    toggleMic 
  } = useSpeechRecognition({
    onResult: (transcript) => setInput(transcript),
    onEnd: () => setAiState((prev) => (prev === "thinking" ? "thinking" : "idle")),
  });

  const ttsOptions = useMemo(() => ({
    onSpeakStart: () => setAiState("speaking"),
    onSpeakEnd: () => {
      setAiState("idle");
      setTimeout(() => {
        if (hasStartedRef.current) startListening(); 
      }, 200);
    },
  }), [startListening]);

  const { speak, cancelSpeech } = useTextToSpeech(ttsOptions);

  // ============================================================
  // 7. ACTION HANDLERS
  // ============================================================

  const handleStop = useCallback(() => {
    // A. Stop AI & Audio
    cancelSpeech();   
    stopListening();  
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;

    // B. SAVE SESSION DATA (Now saving BOTH)
    if (stressTimeline.length > 0 || thermalTimeline.length > 0) {
      console.log(`Saving Data: Optical(${stressTimeline.length}), Thermal(${thermalTimeline.length})`);
      
      const sessionData = {
        optical: stressTimeline,
        thermal: thermalTimeline,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem("lastSessionData", JSON.stringify(sessionData));
    } else {
      console.warn("No stress data collected to save.");
    }

    // C. REDIRECT TO REPORT
    navigate("/report");

  }, [cancelSpeech, stopListening, stressTimeline, thermalTimeline, navigate]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    setStressTimeline([]); 
    setThermalTimeline([]); // Clear old thermal data
    
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

  // ============================================================
  // 8. AUTOMATION EFFECTS
  // ============================================================
  useEffect(() => {
    if (isMicOn && aiState === "idle") setAiState("listening");
  }, [isMicOn, aiState]);

  useEffect(() => {
    if (!isMicOn && input.trim() && hasStarted && aiState === "idle" && !isGeminiLoading) {
      handleSendMessage();
    }
  }, [isMicOn, input, hasStarted, aiState, isGeminiLoading, handleSendMessage]);

  return {
    messages, input, setInput, aiState, hasStarted, isMicOn,
    isSpeaking: aiState === "speaking", isGeminiLoading,
    
    // Camera Props
    cameraProps: visionState,    // Optical (Video)
    thermalProps: thermalState,  // Thermal (Image) <--- Pass this to your ThermalFeed component
    
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  };
}