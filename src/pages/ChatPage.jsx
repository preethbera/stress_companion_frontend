import React, { useState, useEffect, useCallback, useRef } from "react";
import { Mic, MicOff, PhoneOff, MessageSquare, Maximize2, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    setHasStarted(true);
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
          <div className="h-full w-full flex border border-border shadow-2xl overflow-hidden bg-background">
            
            {/* LEFT SIDE: Visuals & Controls */}
            <div className="flex-1 flex flex-col min-w-0 relative">
              <div className="flex-1 relative">
                <div className="absolute top-6 right-6 z-20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        // UPDATED: rounded-full -> rounded-lg to match theme
                        className="rounded-lg h-10 w-10 bg-background/50 backdrop-blur-sm border-border hover:bg-background transition-colors cursor-pointer"
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
                     // UPDATED: rounded-full -> rounded-xl to match theme
                     className="!py-6 !px-10 text-xl font-bold rounded-xl cursor-pointer shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 scale-105 transition-transform"
                     onClick={handleStartSession}
                   >
                     <Play className="mr-2 h-6 w-6" /> Start Conversation
                   </Button>
                ) : (
                   <>
                    <Button
                      // UPDATED: rounded-full -> rounded-xl
                      className={`!py-6 !px-8 text-lg font-semibold rounded-xl cursor-pointer shadow-md transition-all ${
                        isMicOn
                          ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg scale-105"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
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
                      // UPDATED: rounded-full -> rounded-xl
                      className="!py-6 !px-8 text-lg font-semibold rounded-xl border-2 border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
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
                className="w-[1px] hover:w-1 bg-border hover:bg-primary cursor-col-resize z-50 transition-all duration-150 flex flex-col justify-center items-center group -ml-[0.5px] relative"
                onMouseDown={startResizing}
              >
                {/* UPDATED: rounded-full -> rounded-sm (pill shape via radius) */}
                <div className="h-16 w-1.5 rounded-sm bg-primary opacity-0 group-hover:opacity-100 transition-opacity absolute" />
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