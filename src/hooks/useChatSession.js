import { useState, useCallback, useEffect, useRef } from "react";
import { useChatApi } from "@/hooks/useChatApi"; 
import { useVoiceAgent } from "@/hooks/useVoiceAgent"; 
import { useSessionStore } from "@/store/useSessionStore";

export function useChatSession() {
  const micDeviceId = useSessionStore((state) => state.hardwareConfig?.micDeviceId);
  const sessionStatus = useSessionStore((state) => state.sessionStatus);
  const setSessionStatus = useSessionStore((state) => state.setSessionStatus);
  
  const isStarted = sessionStatus === 'active';

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState("idle"); 
  
  const hasStartedRef = useRef(false);

  // Use the newly created API hook with abort capability
  const { sendMessage, abort: abortApi, isLoading: isApiLoading } = useChatApi();

  // Use the newly created Voice Agent without VAD dependencies
  const { 
    isMicOn, 
    isAiSpeaking,
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

  useEffect(() => {
    if (isAiSpeaking) setAiState("speaking");
    else if (isMicOn) setAiState("listening");
    else if (!isMicOn && aiState !== "thinking") setAiState("idle"); 
  }, [isAiSpeaking, isMicOn, aiState]);

  const handleStopGeneration = useCallback(() => {
    abortApi();
    cancelSpeech();
    setAiState("idle");
  }, [abortApi, cancelSpeech]);

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
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    
    clearTranscript(); 
    setAiState("thinking");

    try {
      const aiText = await sendMessage(textToSend);
      setMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: aiText }]);
      speak(aiText);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Just aborted, no error display needed
      } else {
        setAiState("idle");
      }
    }
  }, [input, sendMessage, speak, clearTranscript, handleStopGeneration, isMicOn, stopListening]);

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
      setAiState("listening");
    }
  }, [isMicOn, stopListening, startListening, input, aiState, handleStopGeneration, clearTranscript, handleSendMessage]);

  useEffect(() => {
    if (isStarted && !hasStartedRef.current) {
      hasStartedRef.current = true;
      const initialMsg = "Hello! You can click the microphone to speak or type a message. How are you feeling?";
      setMessages([{ id: Date.now().toString(), role: "assistant", content: initialMsg }]);
      
      // Do not start mic by default. User must click to turn it on.
      speak(initialMsg);
    }
  }, [isStarted, speak, startListening]);

  const handleStop = useCallback(() => {
    handleStopGeneration();
    if(isMicOn) {
      stopListening();
    }
    hasStartedRef.current = false;
    setSessionStatus('ready'); 
  }, [handleStopGeneration, stopListening, setSessionStatus, isMicOn]);

  return {
    messages, 
    input, 
    setInput, 
    aiState, 
    isMicOn, 
    volume,
    isApiLoading,
    handleSendMessage, 
    toggleMic, 
    handleStop,
    handleStopGeneration
  };
}