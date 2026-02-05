import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// --- HOOK IMPORTS ---
import { useGemini } from "@/hooks/useGemini"; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";
import { useStressSocket } from "@/hooks/useStressSocket";

export function useChatSession() {
  // 1. CORE STATE
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle"); 
  const hasStartedRef = useRef(false);

  // 2. VISION & OPTICAL SYSTEM
  const isVisionActive = hasStarted;

  // A. Networking
  const { sendFrame, isConnected: isSocketConnected } = useStressSocket(isVisionActive);

  // B. Hardware (Master Camera)
  const { 
    videoRef: masterVideoRef, 
    stream: activeStream, // <--- DIRECT USE, no redundant useEffect
    error: cameraError, 
    isLoading: isCameraLoading 
  } = useCamera({ isActive: isVisionActive });

  // C. AI Model (Singleton Managed)
  const { detectorRef, isModelLoaded, modelError } = useFaceDetection();

  // D. Tracker (Logic + UI Refs)
  // Only track if vision is active, model is ready, and camera isn't loading
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
    isVisionActive, 
    isModelLoaded, 
    isCameraLoading, 
    isSocketConnected, 
    cameraError, 
    modelError, 
    activeStream, 
    overlayRef, 
    cropCanvasRef, 
    masterVideoRef
  ]);

  // 3. AUDIO & INTELLIGENCE CONFIGURATION
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { isMicOn, startListening, stopListening, toggleMic } = useSpeechRecognition({
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

  // 4. ACTION HANDLERS
  const handleStop = useCallback(() => {
    cancelSpeech();   
    stopListening();  
    setAiState("idle");
    setHasStarted(false);
    hasStartedRef.current = false;
  }, [cancelSpeech, stopListening]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    
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

  // 5. AUTOMATION EFFECTS
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