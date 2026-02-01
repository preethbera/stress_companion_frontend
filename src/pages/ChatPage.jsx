import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, PhoneOff, MessageSquare, Maximize2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- IMPORTS: UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar";
import { VoiceVisualizer } from "@/components/features/chat/VoiceVisualizer";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";

// --- IMPORTS: CUSTOM HOOKS ---
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useGemini } from "@/hooks/useGemini";

export default function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState("idle");
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  const [hasStarted, setHasStarted] = useState(false);
  // FIX: Use a ref to track start status immediately for callbacks
  const hasStartedRef = useRef(false);

  // --- LOGIC: GEMINI API ---
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  // --- LOGIC: SPEECH RECOGNITION ---
  const { isMicOn, toggleMic, startListening, stopListening } = useSpeechRecognition({
    onResult: (transcript) => {
        setInput(transcript);
    },
    onEnd: () => {
      setAiState("idle");
    },
  });

  // --- LOGIC: TEXT TO SPEECH ---
  const { speak, isSpeaking } = useTextToSpeech({
    onSpeakStart: () => {
        setAiState("speaking");
        stopListening();
    },
    onSpeakEnd: () => {
      setAiState("idle");
      // FIX: Check the Ref instead of the state variable
      // The Ref is guaranteed to be true here, whereas state might be stale in this closure
      if (hasStartedRef.current) {
        startListening();
      }
    },
  });

  // --- LOGIC: SEND MESSAGE ---
  const handleSendMessage = useCallback(async (textOverride) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;

    if (!textToSend.trim()) return;

    const userMsg = { id: Date.now(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    
    setInput("");
    setAiState("thinking");
    stopListening(); 

    try {
      const aiText = await sendMessage(textToSend);
      const aiMsg = { id: Date.now(), role: "assistant", content: aiText };
      setMessages((prev) => [...prev, aiMsg]);
      speak(aiText);
    } catch (error) {
      console.error("Failed to get response:", error);
      setAiState("idle");
    }
  }, [input, sendMessage, speak, stopListening]);

  // Sync AI State with Mic
  useEffect(() => {
    if (isMicOn && aiState === "idle") {
      setAiState("listening");
    }
  }, [isMicOn, aiState]);

  // Effect to handle auto-send on silence
  useEffect(() => {
    if (!isMicOn && input.trim() && hasStarted && aiState === 'idle' && !isSpeaking && !isGeminiLoading) {
        handleSendMessage();
    }
  }, [isMicOn, input, hasStarted, aiState, isSpeaking, isGeminiLoading, handleSendMessage]);

  // --- LOGIC: START SESSION ---
  const handleStartSession = () => {
    // 1. Update State (triggers render)
    setHasStarted(true);
    // 2. Update Ref (available immediately for the upcoming speak callback)
    hasStartedRef.current = true;
    
    const initialMsg = "I'm listening. You can speak freely here. How are you feeling?";
    
    setMessages([{
        id: Date.now(),
        role: "assistant",
        content: initialMsg,
    }]);

    speak(initialMsg);
  };

  // --- LOGIC: RESIZABLE PANEL ---
  const { width: chatWidth, isDragging, startResizing } = useResizablePanel(40);

  // --- RENDER ---
  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />

        <div className="flex-1 min-h-0 w-full animate-in fade-in duration-500">
          <div className="h-full w-full flex border border-border/50 shadow-2xl overflow-hidden bg-background">
            
            {/* LEFT SIDE: Visuals & Controls */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              <div className="flex-1 relative">
                <div className="absolute top-6 right-6 z-20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-border hover:bg-background transition-colors cursor-pointer"
                        onClick={() => setIsChatOpen(!isChatOpen)}
                      >
                        {isChatOpen ? (
                          <Maximize2 className="h-5 w-5 text-foreground" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-foreground" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isChatOpen ? "Expand Visuals" : "Open Chat"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* VISUALIZER COMPONENT */}
                <VoiceVisualizer 
                    aiState={aiState} 
                    isUserSpeaking={isMicOn} 
                    hasStarted={hasStarted} 
                />
              </div>

              {/* FOOTER CONTROLS */}
              <div className="h-24 shrink-0 flex items-center gap-4 justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border relative z-20">
                
                {!hasStarted ? (
                   <Button
                     className="!py-6 !px-10 text-xl font-bold rounded-full cursor-pointer shadow-lg bg-green-600 hover:bg-green-700 text-white scale-105 transition-transform"
                     onClick={handleStartSession}
                   >
                     <Play className="mr-2 h-6 w-6" /> Start Conversation
                   </Button>
                ) : (
                   <>
                    <Button
                      className={`!py-6 !px-8 text-lg font-semibold rounded-full cursor-pointer shadow-md transition-all ${
                        isMicOn
                          ? "bg-red-500 hover:bg-red-600 text-white hover:shadow-lg scale-105"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg"
                      }`}
                      onClick={toggleMic}
                      disabled={isGeminiLoading || isSpeaking}
                    >
                      {isGeminiLoading ? (
                        <span className="animate-pulse">Thinking...</span>
                      ) : isSpeaking ? (
                        <span className="animate-pulse">Speaking...</span>
                      ) : isMicOn ? (
                        <>
                          <Mic className="mr-2 h-5 w-5 animate-pulse" /> Stop Listening
                        </>
                      ) : (
                        <>
                          <MicOff className="mr-2 h-5 w-5" /> Tap to Speak
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="!py-6 !px-8 text-lg font-semibold rounded-full border-2 hover:!text-red-500 hover:!border-red-500 transition-colors cursor-pointer"
                      onClick={() => navigate("/dashboard")}
                    >
                      <PhoneOff className="mr-2 h-5 w-5" /> End
                    </Button>
                   </>
                )}
              </div>
            </div>

            {/* RESIZER HANDLE */}
            {isChatOpen && (
              <div
                className="w-[1px] hover:w-1 bg-border/50 hover:bg-blue-500 cursor-col-resize z-50 transition-all duration-150 flex flex-col justify-center items-center group -ml-[0.5px] relative"
                onMouseDown={startResizing}
              >
                <div className="h-16 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
              </div>
            )}

            {/* RIGHT SIDE: Chat Panel */}
            {isChatOpen && (
              <div
                className={`flex flex-col bg-card h-full ${
                  isDragging
                    ? "transition-none pointer-events-none select-none"
                    : "transition-[width] duration-300 ease-out"
                }`}
                style={{ width: `${chatWidth}%` }}
              >
                <ConversationPanel
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  onSendMessage={handleSendMessage}
                  hasStarted={hasStarted}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}