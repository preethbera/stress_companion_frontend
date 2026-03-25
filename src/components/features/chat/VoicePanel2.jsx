import React, { memo, useMemo } from "react";
import {
  Mic,
  MicOff,
  Play,
  Maximize2,
  MessageSquare,
  PhoneOff,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

import { useUIStore } from "@/store/useUIStore";
import { useSessionStore } from "@/store/useSessionStore";
import { RadialVisualizer } from "@/components/ui/RadialVisualizer";

// --- Static Data ---
const USER_WAVE_HEIGHTS = [
  "h-3",
  "h-5",
  "h-8",
  "h-11",
  "h-full",
  "h-full",
  "h-11",
  "h-8",
  "h-5",
  "h-3",
];

const VoicePanel = ({
  aiState = "idle",
  isMicOn = false,
  isUserSpeaking = false,
  onStop,
  onToggleMic,
}) => {
  const hasStarted = useSessionStore((state) => state.conversationStatus === 'started');
  const setConversationStatus = useSessionStore((state) => state.setConversationStatus);

  const isOpticalVisible = useUIStore((state) => state.isOpticalVisible);
  const isThermalVisible = useUIStore((state) => state.isThermalVisible);
  const isTranscriptVisible = useUIStore((state) => state.isTranscriptVisible);

  const isCameraPanelVisible = isOpticalVisible || isThermalVisible;

  const toggleCameraPanel = useUIStore((state) => state.toggleCameraPanel);
  const toggleTranscript = useUIStore((state) => state.toggleTranscript);

  // Dynamic label calculation based on state
  const displayLabel = useMemo(() => {
    if (isUserSpeaking && aiState === "listening") return "Hearing You...";
    switch (aiState) {
      case "listening": return "Listening";
      case "thinking": return "Processing";
      case "speaking": return "AI Speaking";
      default: return "Ready";
    }
  }, [aiState, isUserSpeaking]);

  return (
    <div className="flex flex-col w-full h-full bg-background relative overflow-hidden font-sans">
      <style>{`
        @keyframes user-wave { 
          0%, 100% { height: 25%; opacity: 0.5; } 
          50% { height: 100%; opacity: 1; } 
        }
      `}</style>

      {/* --- MAIN VISUAL AREA --- */}
      <div className="flex-1 relative flex items-center justify-center min-h-0">
        
        {/* Top Right: Chat Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  onClick={toggleTranscript}
                  className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-border hover:bg-background transition-colors"
                  aria-label={isTranscriptVisible ? "Expand Visuals" : "Open Chat"}
                >
                  {isTranscriptVisible ? (
                    <Maximize2 className="h-5 w-5" />
                  ) : (
                    <MessageSquare className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isTranscriptVisible ? "Expand Visuals" : "Open Chat"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Ambient Glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        </div>

        {/* --- Central Circle Visualizer --- */}
        {!hasStarted ? (
          <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in duration-700">
            <div className="w-28 h-28 mb-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <Mic className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">
              Ready to Talk
            </h3>
            <p className="mt-3 text-muted-foreground max-w-sm">
              Click{" "}
              <span className="font-semibold text-primary">
                Start Conversation
              </span>{" "}
              to begin
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            
            {/* The Drop-in Radial Visualizer */}
            <div className="relative flex items-center justify-center h-48 w-48">
              <RadialVisualizer 
                state={aiState === 'idle' ? 'disconnected' : aiState} 
                numberOfBars={32}
                radius={64}
                className="text-primary" 
              />
            </div>

            <p
              className={`mt-10 text-xs uppercase tracking-[0.25em] font-semibold transition-colors duration-300 ${isUserSpeaking ? "text-chart-2" : "text-muted-foreground"}`}
            >
              {displayLabel}
            </p>
          </div>
        )}

        {/* User Voice Waveform (Bottom) */}
        {hasStarted && isMicOn && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-1.5 h-16 px-4 py-2">
              {USER_WAVE_HEIGHTS.map((height, i) => (
                <div
                  key={i}
                  className={`w-1 flex items-center justify-center transition-all duration-300 ${isUserSpeaking ? height : "h-2"}`}
                >
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-chart-2 to-chart-2/50 transition-all duration-200"
                    style={{
                      animation: isUserSpeaking
                        ? "user-wave 0.5s ease-in-out infinite"
                        : "none",
                      animationDelay: isUserSpeaking ? `${i * 0.08}s` : "0s",
                      height: "100%",
                      opacity: isUserSpeaking ? 1 : 0.3,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="h-auto py-6 shrink-0 flex items-center gap-2 justify-center bg-background/95 backdrop-blur border-t border-border z-20 px-4">
        {!hasStarted ? (
          <Button
            onClick={() => setConversationStatus('started')} 
            type="button"
            className="py-6 !px-8 text-xl font-bold rounded-xl shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 scale-105 transition-transform"
          >
            <Play
              className="h-6 w-6 mr-2"
              strokeWidth={4}
              absoluteStrokeWidth
            />
            Start Conversation
          </Button>
        ) : (
          <>
            {/* 1. MIC TOGGLE BUTTON */}
            <Button
              onClick={onToggleMic}
              type="button"
              className={`py-6 !px-5 text-lg font-semibold rounded-xl shadow-md transition-all cursor-pointer ${
                isMicOn
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
              }`}
            >
              {isMicOn ? (
                <div className="flex items-center gap-2">
                  <Mic className="size-5 animate-pulse" />
                  <span className="hidden sm:inline">Stop Listening</span>
                  <span className="sm:hidden">Stop</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MicOff className="size-5" />
                  <span className="hidden sm:inline">Tap to Speak</span>
                  <span className="sm:hidden">Speak</span>
                </div>
              )}
            </Button>

            {/* 2. CAMERA TOGGLE BUTTON */}
            <Button
              variant={isCameraPanelVisible ? "secondary" : "outline"}
              onClick={toggleCameraPanel}
              type="button"
              className={`!py-6 !px-5 font-semibold rounded-xl border-2 transition-colors cursor-pointer ${
                isCameraPanelVisible
                  ? "bg-secondary text-secondary-foreground border-transparent"
                  : "border-border hover:bg-muted"
              }`}
              title="Toggle Camera"
            >
              <Camera className="size-6" />
            </Button>

            {/* 3. END SESSION BUTTON */}
            <Button
              variant="outline"
              onClick={onStop}
              type="button"
              className="!py-6 !px-5 font-semibold rounded-xl border-2 border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <PhoneOff className="size-5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default memo(VoicePanel);