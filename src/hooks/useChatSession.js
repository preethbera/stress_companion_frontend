import { useState, useCallback, useEffect, useRef } from "react";
import { useChatApi } from "@/hooks/useChatApi"; 
import { useVoiceAgent } from "@/hooks/useVoiceAgent"; 
import { useSessionStore } from "@/store/useSessionStore";

export function useChatSession() {
  const micDeviceId = useSessionStore((state) => state.hardwareConfig?.micDeviceId);

  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const setSessionStatus = useSessionStore((state) => state.setSessionStatus);
  
  // Single source of truth from Zustand
  const isStarted = sessionStatus === 'active';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState("idle"); 
  
  const hasStartedRef = useRef(false);

  const { sendMessage, isLoading: isApiLoading } = useChatApi();

  const { 
    isListening: isMicOn, 
    isUserSpeaking, 
    isAiSpeaking,
    startAgent: startListening, 
    stopAgent: stopListening,
    clearTranscript,
    speak,
    cancelSpeech 
  } = useVoiceAgent({
    deviceId: micDeviceId, 
    onResult: (transcript) => setInput(transcript),
    onInterrupt: () => setAiState("idle")
  });

  useEffect(() => {
    if (isAiSpeaking) setAiState("speaking");
    else if (isMicOn && !isAiSpeaking && !isUserSpeaking) setAiState("listening");
    else if (!isMicOn) setAiState("idle");
  }, [isAiSpeaking, isMicOn, isUserSpeaking]);

  const toggleMic = useCallback(() => {
    if (isMicOn) stopListening();
    else startListening();
  }, [isMicOn, startListening, stopListening]);

  // Sync session start logic safely using a Ref to prevent re-renders
  useEffect(() => {
    if (isStarted && !hasStartedRef.current) {
      hasStartedRef.current = true;
      const initialMsg = "I'm listening. You can speak freely here. How are you feeling?";
      setMessages([{ id: Date.now().toString(), role: "assistant", content: initialMsg }]);
      
      startListening(); 
      speak(initialMsg);
    }
  }, [isStarted, speak, startListening]);

  const handleStop = useCallback(() => {
    cancelSpeech();
    stopListening();
    setAiState("idle");
    hasStartedRef.current = false;
    // Tell Zustand to reset so we can start again later!
    setSessionStatus('ready'); 
  }, [cancelSpeech, stopListening, setSessionStatus]);

  const handleSendMessage = useCallback(async (textOverride) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;
    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    
    clearTranscript(); 
    setAiState("thinking");
    cancelSpeech(); 

    try {
      const aiText = await sendMessage(textToSend);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: aiText }]);
      speak(aiText);
    } catch (error) {
      setAiState("idle");
    }
  }, [input, sendMessage, speak, cancelSpeech, clearTranscript]);

  // Auto-send hook dependencies fixed to utilize the global isStarted flag
  useEffect(() => {
    if (isMicOn && !isUserSpeaking && input.trim() && isStarted) {
      const timer = setTimeout(() => handleSendMessage(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isMicOn, isUserSpeaking, input, isStarted, handleSendMessage]);

  return {
    messages, 
    input, 
    setInput, 
    aiState, 
    isMicOn, 
    isSpeaking: isAiSpeaking, 
    isApiLoading,
    handleSendMessage, 
    toggleMic, 
    handleStop,
    isUserSpeaking 
  };
}