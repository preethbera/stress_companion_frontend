import React, { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff, MessageSquare, Maximize2 } from "lucide-react";
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

/* ============================
   SPEECH API SETUP (LOGIC)
============================ */
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;

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
  const [isMicOn, setIsMicOn] = useState(false);
  const [aiState, setAiState] = useState("idle");
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- RESIZABLE PANEL STATE ---
  const [chatWidth, setChatWidth] = useState(40);
  const [isDragging, setIsDragging] = useState(false);

  /* ============================
     INIT SPEECH RECOGNITION
  ============================ */
  useEffect(() => {
    if (!SpeechRecognition) return;

    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsMicOn(false);
      setAiState("idle");
    };

    recognition.onend = () => {
      setIsMicOn(false);
      setAiState("idle");

      if (input.trim()) {
        handleSendMessage();
      }
    };

    return () => {
      recognition && recognition.stop();
    };
  }, [input]);

  /* ============================
     TEXT → SPEECH (AI VOICE)
  ============================ */
  const speak = (text) => {
    if (!window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.2;
    utterance.pitch = 2;

    setAiState("speaking");

    utterance.onend = () => {
      setAiState(isMicOn ? "listening" : "idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  // --- HANDLERS ---
  const handleSendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setAiState("thinking");

    setTimeout(() => {
      const aiText =
        "I understand. Let's focus on that feeling. Take a deep breath with me.";

      const aiMsg = {
        id: Date.now(),
        role: "assistant",
        content: aiText,
      };

      setMessages((prev) => [...prev, aiMsg]);
      speak(aiText);
    }, 1500);
  };

  const toggleMic = () => {
    if (!SpeechRecognition || !recognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (!isMicOn) {
      setIsMicOn(true);
      setAiState("listening");
      recognition.start();
    } else {
      recognition.stop();
      setIsMicOn(false);
      setAiState("idle");
    }
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
    const newWidthPercentage =
      ((window.innerWidth - e.clientX) / window.innerWidth) * 100;
    if (newWidthPercentage > 20 && newWidthPercentage < 70) {
      setChatWidth(newWidthPercentage);
    }
  };

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />

        <div className="flex-1 min-h-0 w-full animate-in fade-in duration-500">
          <div className="h-full w-full flex border border-border/50 shadow-2xl overflow-hidden bg-background">
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

                <VoiceVisualizer aiState={aiState} isUserSpeaking={isMicOn} />
              </div>

              <div className="h-20 shrink-0 flex items-center gap-3 justify-center bg-background border-t border-border">
                <Button
                  className={`!py-6 !px-8 text-lg font-semibold rounded-full cursor-pointer shadow-md transition-all ${
                    isMicOn
                      ? "bg-red-500 hover:bg-red-600 text-white animate-pulse hover:shadow-lg"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-lg"
                  }`}
                  onClick={toggleMic}
                >
                  {isMicOn ? (
                    <>
                      <Mic className="mr-2 h-5 w-5" /> Stop Listening
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

            {isChatOpen && (
              <div
                className="w-[1px] hover:w-1 bg-border/50 hover:bg-blue-500 cursor-col-resize z-50 transition-all duration-150 flex flex-col justify-center items-center group -ml-[0.5px] relative"
                onMouseDown={startResizing}
              >
                <div className="h-16 w-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity absolute" />
              </div>
            )}

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
 