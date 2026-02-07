import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom"; // <--- 1. Import Navigation

// --- HOOK IMPORTS ---
import { useGemini } from "@/hooks/useGemini"; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useOpticalCamera } from "@/hooks/useOpticalCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";
import { useOpticalStressSocket } from "@/hooks/useOpticalStressSocket";

export function useChatSession() {
  const navigate = useNavigate(); // <--- 2. Initialize Navigation

  // ============================================================
  // 1. CORE STATE
  // ============================================================
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle"); 
  
  // <--- 3. NEW STATE: Stress History Accumulator --->
  const [stressTimeline, setStressTimeline] = useState([]); 

  const activeStreamRef = useRef(null); 
  const hasStartedRef = useRef(false);

  // ============================================================
  // 2. VISION & OPTICAL SYSTEM
  // ============================================================
  
  const isVisionActive = hasStarted;

  // <--- 4. DATA HANDLER: Capture Incoming Scores --->
  // We assume useOpticalStressSocket accepts a callback for new messages
  const handleSocketMessage = useCallback((data) => {
    if (data?.stress_score !== undefined) {
      setStressTimeline((prev) => [
        ...prev, 
        { timestamp: Date.now(), score: data.stress_score }
      ]);
    }
  }, []);

  // Pass the handler to the socket hook
  const { sendFrame, isConnected: isSocketConnected } = useOpticalStressSocket(
    isVisionActive, 
    handleSocketMessage 
  );

  // B. Hardware (Master Camera)
  const { 
    videoRef: masterVideoRef, 
    stream: activeStream,
    error: cameraError, 
    isLoading: isCameraLoading 
  } = useOpticalCamera({ isActive: isVisionActive });

  // C. AI Model
  const { detectorRef, isModelLoaded, modelError } = useFaceDetection();

  // D. Tracker
  const shouldTrack = isVisionActive && isModelLoaded && !isCameraLoading;

  const { overlayRef, cropCanvasRef } = useFaceTracker(
    masterVideoRef,      
    detectorRef.current, 
    shouldTrack,         
    sendFrame           
  );

  // E. Vision State Bundle
  const visionState = useMemo(() => ({
    isActive: isVisionActive,
    isLoading: isVisionActive && (!isModelLoaded || isCameraLoading),
    isConnected: isSocketConnected,
    error: cameraError || modelError,
    stream: activeStream,       
    overlayRef,    
    cropCanvasRef,
    masterVideoRef 
  }), [
    isVisionActive, isModelLoaded, isCameraLoading, isSocketConnected, 
    cameraError, modelError, activeStream, overlayRef, cropCanvasRef, masterVideoRef
  ]);

  // ============================================================
  // 3. AUDIO & INTELLIGENCE CONFIGURATION
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
  // 4. ACTION HANDLERS
  // ============================================================

  const handleStop = useCallback(() => {
    // A. Stop AI & Audio
    cancelSpeech();   
    stopListening();  
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;

    // B. SAVE SESSION DATA <--- CRITICAL STEP
    if (stressTimeline.length > 0) {
      console.log("Saving session data...", stressTimeline.length, "points");
      sessionStorage.setItem("lastSessionData", JSON.stringify(stressTimeline));
    } else {
      console.warn("No stress data collected to save.");
    }

    // C. REDIRECT TO REPORT <--- CRITICAL STEP
    navigate("/report");

  }, [cancelSpeech, stopListening, stressTimeline, navigate]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    setStressTimeline([]); // Clear old data
    
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
  // 5. AUTOMATION EFFECTS
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
    cameraProps: visionState, 
    handleStartSession, handleSendMessage, toggleMic, handleStop,
  };
}