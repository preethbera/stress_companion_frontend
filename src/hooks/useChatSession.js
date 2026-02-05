import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useGemini } from "@/hooks/useGemini"; 
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

export function useChatSession() {
  // --- 1. CORE STATE ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const [aiState, setAiState] = useState("idle");
  
  const hasStartedRef = useRef(false);

  // --- 2. SUB-HOOKS & CONFIGURATION ---

  // A. Gemini (Brain)
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  // B. Speech Recognition (Ears)
  const { 
    isMicOn, 
    startListening, 
    stopListening, 
    toggleMic 
  } = useSpeechRecognition({
    onResult: (transcript) => setInput(transcript),
    onEnd: () => {
      // Only set to idle if we aren't currently processing a request
      // This prevents the "thinking" state from being overwritten by the mic turning off
      setAiState((prev) => (prev === "thinking" ? "thinking" : "idle"));
    },
  });

  // C. Text To Speech (Mouth)
  // FIX: We use useMemo to ensure these callbacks are stable and don't re-trigger unnecessary effects
  const ttsOptions = useMemo(() => ({
    onSpeakStart: () => {
      setAiState("speaking");
    },
    onSpeakEnd: () => {
      setAiState("idle");
      
      // FIX: Add a small delay before restarting the mic.
      // Browsers often fail to start recording IMMEDIATELY after TTS ends due to audio resource conflicts.
      setTimeout(() => {
        if (hasStartedRef.current) {
          startListening(); 
        }
      }, 200);
    },
  }), [startListening]); // Depend on startListening being stable

  const { speak, cancelSpeech } = useTextToSpeech(ttsOptions);

  // --- 3. ACTION HANDLERS ---

  const handleStop = useCallback(() => {
    cancelSpeech();   
    stopListening();  
    setAiState("idle");
  }, [cancelSpeech, stopListening]);

  const handleStartSession = useCallback(() => {
    setHasStarted(true);
    hasStartedRef.current = true;
    
    const initialMsg = "I'm listening. You can speak freely here. How are you feeling?";
    
    setMessages([{
      id: Date.now().toString(),
      role: "assistant",
      content: initialMsg,
    }]);

    speak(initialMsg);
  }, [speak]);

  const handleSendMessage = useCallback(async (textOverride) => {
    const textToSend = typeof textOverride === "string" ? textOverride : input;

    if (!textToSend.trim()) return;

    // 1. Add User Message
    const userMsg = { 
      id: Date.now().toString(), 
      role: "user", 
      content: textToSend 
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    
    // 2. Set State
    setAiState("thinking");
    cancelSpeech(); 
    stopListening(); 

    try {
      // 3. Get AI Response
      const aiText = await sendMessage(textToSend);
      
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiText,
      };
      
      // 4. Update UI & Speak
      setMessages((prev) => [...prev, aiMsg]);
      speak(aiText);
      
    } catch (error) {
      console.error("Failed to get response:", error);
      setAiState("idle");
    }
  }, [input, sendMessage, speak, cancelSpeech, stopListening]);

  // --- 4. AUTOMATION EFFECTS ---

  // Sync Visual State when Mic is toggled manually
  useEffect(() => {
    if (isMicOn && aiState === "idle") {
      setAiState("listening");
    }
  }, [isMicOn, aiState]);

  // AUTO-SEND LOGIC
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
  }, [
    isMicOn, 
    input, 
    hasStarted, 
    aiState, 
    isGeminiLoading, 
    handleSendMessage
  ]);

  // --- 5. EXPORT ---
  return {
    messages,
    input,
    setInput,
    aiState,
    hasStarted,
    isMicOn,
    isSpeaking: aiState === "speaking", 
    isGeminiLoading,
    handleStartSession,
    handleSendMessage,
    toggleMic,
    handleStop,
  };
}