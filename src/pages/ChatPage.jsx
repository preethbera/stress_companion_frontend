import React, { useState, useRef } from "react";
import { Mic, MicOff, PhoneOff, MessageSquare, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Navbar } from "@/components/layout/Navbar"; // IMPORT ADDED
import { VoiceVisualizer } from "@/components/features/chat/VoiceVisualizer";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";

// ACCEPT PROPS FOR NAVBAR
export default function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();

  // --- STATE ---
  const [messages, setMessages] = useState([
    { 
      id: Date.now(), 
      role: "assistant", 
      content: "I'm listening. You can speak freely here. How are you feeling?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  const [aiState, setAiState] = useState('idle');
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- RESIZABLE PANEL STATE ---
  const [chatWidth, setChatWidth] = useState(35);
  const [isDragging, setIsDragging] = useState(false);

  // --- HANDLERS ---
  const handleSendMessage = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    setAiState('thinking');
    setTimeout(() => {
      setAiState('speaking');
      const aiMsg = { id: Date.now(), role: "assistant", content: "I understand. Let's focus on that feeling. Take a deep breath with me." };
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => setAiState(isMicOn ? 'listening' : 'idle'), 4000);
    }, 1500);
  };

  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    setAiState(newState ? 'listening' : 'idle');
  };

  // --- RESIZE LOGIC ---
  const startResizing = (e) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none"; 
  };

  const stopResizing = () => {
    setIsDragging(false);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  };

  const handleMouseMove = (e) => {
    const newWidthPercentage = ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
    if (newWidthPercentage > 20 && newWidthPercentage < 70) {
      setChatWidth(newWidthPercentage);
    }
  };

  return (
    <TooltipProvider>
      {/* FULL PAGE SHELL 
        h-screen: Forces full viewport height
        flex-col: Stacks Navbar and Main Content
      */}
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        
        {/* 1. NAVBAR (Self-Contained) */}
        <Navbar user={user} onLogout={onLogout} />

        {/* 2. MAIN CONTENT AREA (Fills remaining space) */}
        <div className="flex-1 min-h-0 w-full p-4 md:p-6 animate-in fade-in duration-500">
          
          {/* THE MAIN CONSOLE CARD */}
          <div className="h-full w-full flex rounded-3xl border border-border/50 shadow-2xl overflow-hidden bg-background">
            
            {/* === LEFT: Visualizer Area === */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-slate-950">
                
                {/* Visualizer Frame */}
                <div className="flex-1 relative">
                  
                  {/* Floating Toggle Button */}
                  <div className="absolute top-6 right-6 z-20">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-white/50 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
                          onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                          {isChatOpen ? <Maximize2 className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>{isChatOpen ? "Expand Visuals" : "Open Chat"}</p></TooltipContent>
                    </Tooltip>
                  </div>
                  
                  <VoiceVisualizer aiState={aiState} isUserSpeaking={isMicOn} />
                </div>

                {/* Controls Bar */}
                <div className="h-24 shrink-0 flex items-center gap-6 justify-center bg-slate-900/50 backdrop-blur-md border-t border-white/5">
                  <Button 
                    className={`h-14 min-w-[200px] text-lg font-semibold rounded-full shadow-lg transition-all transform hover:scale-105 ${
                      isMicOn 
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-500/20" 
                      : "bg-white text-slate-900 hover:bg-blue-50"
                    }`}
                    onClick={toggleMic}
                  >
                    {isMicOn ? <><Mic className="mr-2 h-5 w-5" /> Stop Listening</> : <><MicOff className="mr-2 h-5 w-5" /> Tap to Speak</>}
                  </Button>

                  <Button 
                    variant="outline"
                    className="h-14 px-8 text-lg font-semibold rounded-full border-white/10 text-white hover:bg-white/10 hover:text-red-400 hover:border-red-500/50 transition-all"
                    onClick={() => navigate("/dashboard")}
                  >
                    <PhoneOff className="mr-2 h-5 w-5" /> End
                  </Button>
                </div>
            </div>

            {/* === DRAGGER HANDLE === */}
            {isChatOpen && (
              <div 
                className="w-[1px] hover:w-1 bg-border/50 hover:bg-blue-500 cursor-col-resize z-50 transition-all duration-150 flex flex-col justify-center items-center group -ml-[0.5px] relative"
                onMouseDown={startResizing}
              >
                 {/* Visual Pill on Hover */}
                 <div className="h-16 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
              </div>
            )}

            {/* === RIGHT: Chat Panel === */}
            {isChatOpen && (
              <div 
                className={`flex flex-col bg-card h-full ${
                    isDragging ? 'transition-none pointer-events-none select-none' : 'transition-[width] duration-300 ease-out'
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