import React, { memo } from "react";
import { Mic } from "lucide-react";

/*
  ==========================================
  Animations
  Kept exactly as-is (no behavior changes)
  ==========================================
*/
const ANIMATIONS = `
  @keyframes ai-wave {
    0%, 100% { height: 12%; opacity: 0.4; }
    50% { height: 100%; opacity: 1; }
  }

  @keyframes user-wave {
    0%, 100% { height: 25%; opacity: 0.5; }
    50% { height: 100%; opacity: 1; }
  }

  @keyframes pulse-ring {
    0% { transform: scale(0.95); opacity: 0.8; }
    50% { transform: scale(1.05); opacity: 0.4; }
    100% { transform: scale(0.95); opacity: 0.8; }
  }
`;

/*
  ==========================================
  State Configuration
  Refactored to use Semantic Tokens (Primary, Muted, Border, Chart-2)
  ==========================================
*/
const STATE_CONFIG = {
  speaking: {
    size: "w-48 h-48",
    // Primary gradient for AI speaking
    bg: "bg-gradient-to-br from-primary/10 via-primary/5 to-background",
    border: "border-2 border-primary/20",
    // Using semantic shadow color with opacity
    shadow: "shadow-md shadow-primary/20",
    label: "AI Speaking",
  },
  thinking: {
    size: "w-48 h-48",
    // Glassmorphism using muted/card tokens
    bg: "bg-background/40 backdrop-blur-md",
    border: "border border-primary/20",
    shadow: "shadow-md",
    label: "Processing",
  },
  listening: {
    size: "w-44 h-44",
    // Chart-2 (Teal) used for User/Listening state to differentiate from AI
    bg: "bg-gradient-to-br from-chart-2/10 to-background",
    border: "border-2 border-chart-2/20",
    shadow: "shadow-md shadow-chart-2/10",
    label: "Listening",
  },
  idle: {
    size: "w-44 h-44",
    // Standard surface tokens
    bg: "bg-card",
    border: "border border-border",
    shadow: "shadow-md",
    label: "Ready",
  },
};

/*
  ==========================================
  Small focused visual components
  ==========================================
*/

const AIWaveform = memo(() => (
  <div className="flex items-center gap-2 h-20">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        // Switched from indigo to primary
        className="w-2.5 rounded-full bg-gradient-to-t from-primary to-primary/60"
        style={{
          animation: "ai-wave 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }}
      />
    ))}
  </div>
));

const ThinkingIndicator = memo(() => (
  <div className="relative w-full h-full flex items-center justify-center">
    <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
      {/* Replaced hardcoded shadow/colors with primary */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-4 h-4 bg-primary rounded-full shadow-lg shadow-primary/50" />
    </div>
    <div className="w-2 h-2 rounded-full bg-primary/50" />
  </div>
));

const IdleListeningIndicator = memo(({ listening }) => {
  if (listening) {
    return (
      <div className="relative">
        {/* Replaced Emerald with Chart-2 */}
        <div className="absolute inset-0 rounded-full bg-chart-2/20 animate-ping" />
        <Mic className="relative z-10 h-12 w-12 text-chart-2" />
      </div>
    );
  }

  // Replaced Slate with Muted-Foreground
  return <div className="h-5 w-5 rounded-full bg-muted-foreground/30 animate-pulse" />;
});

const UserWaveform = memo(() => {
  const barHeights = ["h-3", "h-5", "h-8", "h-11", "h-full", "h-full", "h-11", "h-8", "h-5", "h-3"];

  return (
    <div className="flex items-center gap-1.5 h-16 px-4 py-2">
      {barHeights.map((heightClass, i) => (
        <div 
          key={i} 
          className={`w-1 ${heightClass} flex items-center justify-center`}
        >
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
  );
});

const EmptyState = memo(() => (
  <div className="relative z-10 flex flex-col items-center text-center px-6 animate-in fade-in zoom-in duration-700">
    {/* Replaced indigo/slate hexes with semantic surface tokens */}
    <div className="w-28 h-28 mb-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
      <Mic className="w-12 h-12 text-primary" />
    </div>
    <h3 className="text-2xl font-semibold text-foreground">Ready to Talk</h3>
    <p className="mt-3 text-muted-foreground max-w-sm">
      Click <span className="font-semibold text-primary">Start Conversation</span> to begin
    </p>
  </div>
));

/*
  ==========================================
  Main VoiceVisualizer Component
  ==========================================
*/

export const VoiceVisualizer = memo(function VoiceVisualizer({
  aiState = "idle",
  isUserSpeaking = false,
  hasStarted = false,
}) {
  const config = STATE_CONFIG[aiState] ?? STATE_CONFIG.idle;

  return (
    // Replaced fixed slate gradient with bg-background and muted overlay
    <div className="relative w-full h-full flex items-center justify-center bg-background transition-colors duration-500 overflow-hidden">
      <style>{ANIMATIONS}</style>

      {/* Ambient background blobs - using Primary token */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] animate-pulse" />
      </div>

      {!hasStarted ? (
        <EmptyState />
      ) : (
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-700 ${config.size} ${config.bg} ${config.border} ${config.shadow}`}
          >
            {aiState === "speaking" && <AIWaveform />}
            {aiState === "thinking" && <ThinkingIndicator />}
            {(aiState === "idle" || aiState === "listening") && (
              <IdleListeningIndicator listening={aiState === "listening"} />
            )}
          </div>

          <p className="mt-10 text-xs uppercase tracking-[0.25em] font-semibold text-muted-foreground">
            {config.label}
          </p>
        </div>
      )}

      {hasStarted && isUserSpeaking && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <UserWaveform />
        </div>
      )}
    </div>
  );
});