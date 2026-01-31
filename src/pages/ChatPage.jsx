import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, PhoneOff, MessageSquare, Maximize2 } from "lucide-react";
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

export default function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

  // --- STATE ---
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: "assistant",
      content: "I'm listening. You can speak freely here. How are you feeling?",
    },
  ]);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState("idle");
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- LOGIC: TEXT TO SPEECH ---
  const { speak } = useTextToSpeech({
    onSpeakStart: () => setAiState("speaking"),
    onSpeakEnd: () => setAiState("idle"), // Will be overridden by mic check logic below
  });

  // --- LOGIC: SEND MESSAGE ---
  // Wrapped in useCallback so hooks can use it safely
  const handleSendMessage = useCallback(() => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    
    // Store input locally before clearing, in case you need it for API calls
    const currentInput = input; 
    setInput("");
    setAiState("thinking");

    // Simulated AI Response
    setTimeout(() => {
      const aiText = "I understand. Let's focus on that feeling. Take a deep breath with me.";
      const aiMsg = {
        id: Date.now(),
        role: "assistant",
        content: aiText,
      };
      setMessages((prev) => [...prev, aiMsg]);
      speak(aiText);
    }, 1500);
  }, [input, speak]);

  // --- LOGIC: SPEECH RECOGNITION ---
  const { isMicOn, toggleMic } = useSpeechRecognition({
    onResult: (transcript) => setInput(transcript),
    onEnd: () => {
      // Logic from original file: if input exists when mic stops, send it.
      if (input.trim()) {
        handleSendMessage();
      }
      setAiState("idle");
    },
  });

  // Sync AI State with Mic (if mic is on, we are 'listening')
  useEffect(() => {
    if (isMicOn && aiState === "idle") {
      setAiState("listening");
    }
  }, [isMicOn, aiState]);

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
                <VoiceVisualizer aiState={aiState} isUserSpeaking={isMicOn} />
              </div>

              {/* FOOTER CONTROLS */}
              <div className="h-24 shrink-0 flex items-center gap-4 justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border relative z-20">
                <Button
                  className={`!py-6 !px-8 text-lg font-semibold rounded-full cursor-pointer shadow-md transition-all ${
                    isMicOn
                      ? "bg-red-500 hover:bg-red-600 text-white hover:shadow-lg scale-105"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg"
                  }`}
                  onClick={toggleMic}
                >
                  {isMicOn ? (
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
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}