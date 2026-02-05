import React, { memo, useMemo } from "react";
import { 
  Mic, 
  MicOff, 
  Play, 
  Maximize2, 
  MessageSquare, 
  PhoneOff,
  Camera 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";

// --- Static Data (Moved outside to prevent re-creation on every render) ---
const AI_WAVE_BARS = [0, 1, 2, 3, 4];
const USER_WAVE_HEIGHTS = ["h-3", "h-5", "h-8", "h-11", "h-full", "h-full", "h-11", "h-8", "h-5", "h-3"];

// --- Configuration for Visual States ---
const VISUAL_STATES = {
  idle: {
    size: "w-44 h-44",
    style: "bg-card border border-border shadow-md",
    label: "Ready",
  },
  listening: {
    size: "w-44 h-44",
    style: "bg-gradient-to-br from-chart-2/10 to-background border-2 border-chart-2/20 shadow-md shadow-chart-2/10",
    label: "Listening",
  },
  thinking: {
    size: "w-48 h-48",
    style: "bg-background/40 backdrop-blur-md border border-primary/20 shadow-md",
    label: "Processing",
  },
  speaking: {
    size: "w-48 h-48",
    style: "bg-gradient-to-br from-primary/10 via-primary/5 to-background border-2 border-primary/20 shadow-md shadow-primary/20",
    label: "AI Speaking",
  },
};

const VoicePanel = ({
  aiState = "idle",
  hasStarted = false,
  isMicOn = false,
  isGeminiLoading = false,
  isSpeaking = false,
  isChatOpen = true,
  // New props for camera control
  isCameraActive = false, 
  onStart,
  onStop,
  onToggleMic,
  onToggleChat,
  onToggleCamera,
}) => {
  
  // Memoize the current visual state to ensure efficiency
  const currentState = useMemo(() => VISUAL_STATES[aiState] || VISUAL_STATES.idle, [aiState]);

  return (
    <div className="flex flex-col w-full h-full bg-background relative overflow-hidden font-sans">
      
      {/* NOTE: In a strictly production app, move these keyframes to your global CSS 
        or tailwind.config.js to avoid style injection on render. 
        Kept here for portability as requested. 
      */}
      <style>{`
        @keyframes ai-wave { 
          0%, 100% { height: 12%; opacity: 0.4; } 
          50% { height: 100%; opacity: 1; } 
        }
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
                  onClick={onToggleChat}
                  className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-border hover:bg-background transition-colors"
                  aria-label={isChatOpen ? "Expand Visuals" : "Open Chat"}
                >
                  {isChatOpen ? <Maximize2 className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isChatOpen ? "Expand Visuals" : "Open Chat"}</p>
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
            <h3 className="text-2xl font-semibold text-foreground">Ready to Talk</h3>
            <p className="mt-3 text-muted-foreground max-w-sm">
              Click <span className="font-semibold text-primary">Start Conversation</span> to begin
            </p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            {/* The Orb */}
            <div className={`relative flex items-center justify-center rounded-full transition-all duration-700 ${currentState.size} ${currentState.style}`}>
              
              {aiState === "speaking" && (
                <div className="flex items-center gap-2 h-20">
                  {AI_WAVE_BARS.map((i) => (
                    <div
                      key={i}
                      className="w-2.5 rounded-full bg-gradient-to-t from-primary to-primary/60"
                      style={{
                        animation: "ai-wave 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              {aiState === "thinking" && (
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-primary/50" />
                </div>
              )}

              {(aiState === "idle" || aiState === "listening") && (
                 aiState === "listening" ? (
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-chart-2/20 animate-ping" />
                    <Mic className="relative z-10 h-12 w-12 text-chart-2" />
                  </div>
                 ) : (
                  <div className="h-5 w-5 rounded-full bg-muted-foreground/30 animate-pulse" />
                 )
              )}
            </div>

            <p className="mt-10 text-xs uppercase tracking-[0.25em] font-semibold text-muted-foreground">
              {currentState.label}
            </p>
          </div>
        )}

        {/* User Voice Waveform (Bottom) */}
        {hasStarted && isMicOn && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="flex items-center gap-1.5 h-16 px-4 py-2">
              {USER_WAVE_HEIGHTS.map((height, i) => (
                <div key={i} className={`w-1 ${height} flex items-center justify-center`}>
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-chart-2 to-chart-2/50"
                    style={{
                      animation: "user-wave 0.5s ease-in-out infinite",
                      animationDelay: `${i * 0.08}s`,
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
            onClick={onStart}
            type="button"
            className="py-6 !px-8 text-xl font-bold rounded-xl shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 scale-105 transition-transform"
          >
            <Play className="h-6 w-6" strokeWidth={4} absoluteStrokeWidth /> 
            Start Conversation
          </Button>
        ) : (
          <>
            {/* 1. MIC TOGGLE BUTTON */}
            <Button
              onClick={onToggleMic}
              type="button"
              disabled={isGeminiLoading || isSpeaking}
              className={`py-6 !px-5 text-lg font-semibold rounded-xl shadow-md transition-all cursor-pointer ${
                isMicOn
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-lg scale-105"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg"
              }`}
            >
              {isGeminiLoading ? (
                <span className="animate-pulse">Thinking...</span>
              ) : isSpeaking ? (
                <span className="animate-pulse">Speaking...</span>
              ) : isMicOn ? (
                <>
                  <Mic className="mr-2 h-5 w-5 animate-pulse" />
                  <span className="hidden sm:inline">Stop Listening</span>
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

            {/* 2. CAMERA TOGGLE BUTTON (NEW) */}
            <Button
              variant={isCameraActive ? "secondary" : "outline"}
              onClick={onToggleCamera}
              type="button"
              className={`!py-6 !px-5 text-lg font-semibold rounded-xl border-2 transition-colors cursor-pointer ${
                isCameraActive 
                  ? "bg-secondary text-secondary-foreground border-transparent"
                  : "border-border hover:bg-muted"
              }`}
              title="Toggle Camera"
            >
              <Camera className="h-8 w-8" />
            </Button>

            {/* 3. END SESSION BUTTON */}
            <Button
              variant="outline"
              onClick={onStop}
              type="button"
              className="!py-6 !px-5 text-lg font-semibold rounded-xl border-2 border-border hover:border-destructive hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <PhoneOff className=" h-5 w-5"/>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

// Wrap in memo for performance optimization
export default memo(VoicePanel);