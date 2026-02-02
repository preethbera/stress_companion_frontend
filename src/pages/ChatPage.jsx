import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Maximize2,
  Play,
  SeparatorVertical,
  SeparatorHorizontal,
} from "lucide-react";

// Components
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

// Hooks
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useResizablePanel } from "@/hooks/useResizablePanel";
import { useGemini } from "@/hooks/useGemini";

// --- UTILITY HOOKS ---

/**
 * Hook to safely detect screen size for responsive logic (avoids hydration errors)
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

/**
 * Hook to handle vertical resizing on mobile devices
 */
function useMobileResizer(initialHeight = 45) {
  const [height, setHeight] = useState(initialHeight);
  const [isDragging, setIsDragging] = useState(false);

  const startResizing = useCallback((e) => {
    // Prevent default to stop scrolling while dragging
    if (e.cancelable) e.preventDefault();
    setIsDragging(true);

    const startY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const startHeight = height;
    const containerHeight = window.innerHeight;

    const handleMove = (moveEvent) => {
      const currentY =
        "touches" in moveEvent
          ? moveEvent.touches[0].clientY
          : moveEvent.clientY;
      const deltaY = currentY - startY;
      const deltaPercentage = (deltaY / containerHeight) * 100;

      // Limit resizing between 20% and 80%
      const newHeight = Math.min(
        80,
        Math.max(20, startHeight + deltaPercentage)
      );
      setHeight(newHeight);
    };

    const handleUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: false });
    document.addEventListener("touchend", handleUp);
  }, [height]);

  return { height, isDragging, startResizing };
}

// --- MAIN COMPONENT ---

export default function ChatPage({ user, onLogout }) {
  const navigate = useNavigate();
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // --- STATE ---
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState("idle"); // idle, listening, thinking, speaking
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const hasStartedRef = useRef(false);

  // --- EXTERNAL HOOKS ---
  const { sendMessage, isLoading: isGeminiLoading } = useGemini();

  const { isMicOn, toggleMic, startListening, stopListening } =
    useSpeechRecognition({
      onResult: (transcript) => setInput(transcript),
      onEnd: () => setAiState("idle"),
    });

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

  // --- RESIZING LOGIC ---
  // Desktop (Horizontal)
  const {
    width: chatWidth,
    isDragging: isDesktopDragging,
    startResizing: startDesktopResizing,
  } = useResizablePanel(40);

  // Mobile (Vertical)
  const {
    height: mobileHeight,
    isDragging: isMobileDragging,
    startResizing: startMobileResizing,
  } = useMobileResizer(45);

  const isResizing = isDesktopDragging || isMobileDragging;

  // --- EVENT HANDLERS ---

  const handleSendMessage = useCallback(
    async (textOverride) => {
      const textToSend =
        typeof textOverride === "string" ? textOverride : input;

      if (!textToSend.trim()) return;

      const userMsg = { id: Date.now(), role: "user", content: textToSend };
      setMessages((prev) => [...prev, userMsg]);

      setInput("");
      setAiState("thinking");
      stopListening();

      try {
        const aiText = await sendMessage(textToSend);
        const aiMsg = {
          id: Date.now(),
          role: "assistant",
          content: aiText,
        };
        setMessages((prev) => [...prev, aiMsg]);
        speak(aiText);
      } catch (error) {
        console.error("Failed to get response:", error);
        setAiState("idle");
      }
    },
    [input, sendMessage, speak, stopListening]
  );

  const handleStartSession = () => {
    setHasStarted(true);
    hasStartedRef.current = true;
    const initialMsg =
      "I'm listening. You can speak freely here. How are you feeling?";

    setMessages([
      {
        id: Date.now(),
        role: "assistant",
        content: initialMsg,
      },
    ]);
    speak(initialMsg);
  };

  // --- EFFECTS ---

  // Sync AI State with Mic
  useEffect(() => {
    if (isMicOn && aiState === "idle") {
      setAiState("listening");
    }
  }, [isMicOn, aiState]);

  // Auto-send on silence
  useEffect(() => {
    if (
      !isMicOn &&
      input.trim() &&
      hasStarted &&
      aiState === "idle" &&
      !isSpeaking &&
      !isGeminiLoading
    ) {
      handleSendMessage();
    }
  }, [
    isMicOn,
    input,
    hasStarted,
    aiState,
    isSpeaking,
    isGeminiLoading,
    handleSendMessage,
  ]);

  // --- RENDER HELPERS ---

  // Calculate panel styles based on device type to prevent hydration mismatches
  const visualsPanelStyle =
    !isDesktop && isChatOpen ? { height: `${mobileHeight}%` } : undefined;

  const chatPanelStyle =
    isDesktop && isChatOpen ? { width: `${chatWidth}%` } : undefined;

  return (
    <TooltipProvider>
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        <Navbar user={user} onLogout={onLogout} />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 w-full animate-in fade-in duration-500">
          <div
            className={`h-full w-full flex flex-col lg:flex-row border border-border shadow-2xl overflow-hidden bg-background ${
              isResizing ? "select-none cursor-grabbing" : ""
            }`}
          >
            {/* --- LEFT SIDE (Visuals & Controls) --- */}
            <div
              className={`flex flex-col min-w-0 relative transition-all duration-300 lg:transition-none ${
                isChatOpen ? "lg:flex-1" : "h-full flex-1"
              }`}
              style={visualsPanelStyle}
            >
              <div className="flex-1 relative min-h-0">
                {/* Toggle Chat Button */}
                <div className="absolute top-4 right-4 lg:top-6 lg:right-6 z-20">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={isChatOpen ? "Expand Visuals" : "Open Chat"}
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

                <VoiceVisualizer
                  aiState={aiState}
                  isUserSpeaking={isMicOn}
                  hasStarted={hasStarted}
                />
              </div>

              {/* Footer Controls */}
              <div className="h-auto py-4 lg:py-0 lg:h-20 shrink-0 flex items-center gap-3 lg:gap-4 justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border relative z-20 px-4">
                {!hasStarted ? (
                  <Button
                    className="!py-4 !px-6 lg:!py-6 lg:!px-10 text-lg lg:text-xl font-bold rounded-xl cursor-pointer shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 scale-105 transition-transform"
                    onClick={handleStartSession}
                  >
                    <Play className="mr-2 h-5 w-5 lg:h-6 lg:w-6" /> Start
                    Conversation
                  </Button>
                ) : (
                  <>
                    <Button
                      className={`!py-4 !px-6 lg:!py-6 lg:!px-8 text-base lg:text-lg font-semibold rounded-xl cursor-pointer shadow-md transition-all ${
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
                          <Mic className="mr-2 h-5 w-5 animate-pulse" />
                          <span className="hidden sm:inline">
                            Stop Listening
                          </span>
                          <span className="sm:hidden">Stop</span>
                        </>
                      ) : (
                        <>
                          <MicOff className="mr-2 h-5 w-5" />
                          <span className="hidden sm:inline">Tap to Speak</span>
                          <span className="sm:hidden">Speak</span>
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      className="!py-4 !px-6 lg:!py-6 lg:!px-8 text-base lg:text-lg font-semibold rounded-xl border-2 border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() => navigate("/dashboard")}
                    >
                      <PhoneOff className="mr-2 h-5 w-5" />
                      <span className="hidden sm:inline">End</span>
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* --- RESIZER HANDLES --- */}

            {/* Mobile (Vertical) */}
            {isChatOpen && (
              <div
                className="flex lg:hidden w-full h-[1px] bg-border relative items-center justify-center cursor-row-resize z-50 group shrink-0"
                onMouseDown={startMobileResizing}
                onTouchStart={startMobileResizing}
                aria-hidden="true"
              >
                <div className="absolute inset-x-0 -top-3 -bottom-3 z-10 bg-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                  <SeparatorHorizontal className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Desktop (Horizontal) */}
            {isChatOpen && (
              <div
                className="hidden lg:flex w-[1px] bg-border relative items-center justify-center cursor-col-resize z-50 group hover:bg-primary/50 transition-colors"
                onMouseDown={startDesktopResizing}
                aria-hidden="true"
              >
                <div className="absolute inset-y-0 -left-2 -right-2 z-10 bg-transparent" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 h-7 w-7 rounded-full bg-background border border-border flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <SeparatorVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* --- RIGHT SIDE (Chat Panel) --- */}
            {isChatOpen && (
              <div
                // SCROLL FIX: Added 'min-h-0' and 'h-full' to ensure flex child can scroll internally
                className={`flex flex-col bg-card w-full lg:w-auto flex-1 lg:flex-none h-full min-h-0 border-t lg:border-t-0 border-border relative ${
                  isResizing
                    ? "transition-none pointer-events-none select-none"
                    : "transition-all duration-300 ease-out"
                }`}
                style={chatPanelStyle}
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