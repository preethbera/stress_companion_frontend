import { useState, useCallback, useEffect, useRef } from "react";
import { useChatApi } from "@/hooks/useChatApi"; 
import { useVoiceAgent } from "@/hooks/useVoiceAgent"; 
import { useSessionStore } from "@/store/useSessionStore";
import { sessionService } from "@/lib/services/sessionService";

export function useChatSession() {
  const activeSessionId = useSessionStore((state) => state.activeSessionId);
  const micDeviceId = useSessionStore((state) => state.hardwareConfig?.micDeviceId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const setSessionStatus = useSessionStore((state) => state.setSessionStatus);
  
  const aiState = useSessionStore((state) => state.aiState);
  const setAiState = useSessionStore((state) => state.setAiState);
  const isMicOn = useSessionStore((state) => state.isMicOn);
  
  const chatHistory = useSessionStore((state) => state.chatHistory);
  const setChatHistory = useSessionStore((state) => state.setChatHistory);
  const addChatMessage = useSessionStore((state) => state.addChatMessage);
  
  const isStarted = sessionStatus === 'active';

  const [input, setInput] = useState("");
  
  const hasStartedRef = useRef(false);

  // Use the newly created API hook with abort capability
  const { sendMessage, abort: abortApi, isLoading: isApiLoading } = useChatApi();

  // Use the newly created Voice Agent without VAD dependencies
  const { 
    volume,
    startAgent: startListening, 
    stopAgent: stopListening,
    clearTranscript,
    speak,
    cancelSpeech,
    transcript // realtime transcript from SpeechService
  } = useVoiceAgent({
    deviceId: micDeviceId, 
    onResult: () => {}, 
    onInterrupt: () => {}
  });

  // Sync realtime transcript to input when mic is on so user can see what's being heard
  useEffect(() => {
    if (isMicOn) {
      setInput(transcript);
    }
  }, [transcript, isMicOn]);

  const handleStopGeneration = useCallback(() => {
    abortApi();
    cancelSpeech();
    setAiState("idle");
  }, [abortApi, cancelSpeech, setAiState]);

  const handleSendMessage = useCallback(async (textOverride) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;
    if (!textToSend.trim()) return;

    // Interrupt any ongoing generation if we send a new message
    handleStopGeneration();

    // Turn off mic if it was on (manual submit while mic was open)
    if (isMicOn) {
      stopListening();
    }

    const userMsg = { id: Date.now().toString(), role: "user", content: textToSend };
    addChatMessage(userMsg);
    setInput("");

    clearTranscript(); 
    setAiState("thinking");

    try {
      const aiText = await sendMessage(textToSend);
      const aiMsg = { id: (Date.now() + 1).toString(), role: "assistant", content: aiText };
      addChatMessage(aiMsg);
      speak(aiText);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Just aborted, no error display needed
      } else {
        setAiState("idle");
      }
    }
  }, [input, sendMessage, speak, clearTranscript, handleStopGeneration, isMicOn, stopListening, setAiState, addChatMessage, activeSessionId]);

  const toggleMic = useCallback(() => {
    if (isMicOn) {
      // User turned off mic -> Stop listening and auto-send
      const finalTranscript = stopListening();
      if (finalTranscript || input.trim()) {
        const textToSend = finalTranscript || input.trim();
        handleSendMessage(textToSend);
      } else {
        setAiState("idle");
      }
    } else {
      // User turned on mic -> Stop whatever AI was doing and start listening
      if (aiState === "thinking" || aiState === "speaking") {
        handleStopGeneration();
      }
      setInput("");
      clearTranscript();
      startListening();
      // startListening now handles setting aiState to "listening" and isMicOn to true
    }
  }, [isMicOn, stopListening, startListening, input, aiState, handleStopGeneration, clearTranscript, handleSendMessage, setAiState]);

  useEffect(() => {
    if (isStarted && !hasStartedRef.current) {
      hasStartedRef.current = true;
      const initialMsg = "Hello! You can click the microphone to speak or type a message. How are you feeling?";
      
      const bootMsg = { id: Date.now().toString(), role: "assistant", content: initialMsg };
      setChatHistory([bootMsg]);
      
      // Also potentially save the boots message to backend since it starts the chat flow
      if (activeSessionId) {
        sessionService.saveChatMessage(activeSessionId, "assistant", initialMsg).catch(err => console.error("Sync error:", err));
      }

      // Do not start mic by default. User must click to turn it on.
      speak(initialMsg);
    }
  }, [isStarted, speak, startListening, activeSessionId, setChatHistory]);

  const handleStop = useCallback(() => {
    handleStopGeneration();
    if(isMicOn) {
      stopListening();
    }
    hasStartedRef.current = false;
    setSessionStatus('ready'); 
  }, [handleStopGeneration, stopListening, setSessionStatus, isMicOn]);

  return {
    messages: chatHistory, 
    input, 
    setInput, 
    volume,
    isApiLoading,
    handleSendMessage, 
    toggleMic, 
    handleStop,
    handleStopGeneration
  };
}