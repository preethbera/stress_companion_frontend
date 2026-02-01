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
  State Configuration (single source of truth)
  ==========================================
*/
const STATE_CONFIG = {
  speaking: {
    size: "w-48 h-48",
    bg: "bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white dark:from-slate-900 dark:via-indigo-950/50 dark:to-slate-950",
    border: "border-2 border-indigo-200/60 dark:border-indigo-800/40",
    shadow: "shadow-[0_0_100px_rgba(99,102,241,0.3)] dark:shadow-[0_0_100px_rgba(99,102,241,0.2)]",
    label: "AI Speaking",
  },
  thinking: {
    size: "w-48 h-48",
    bg: "bg-white/20 dark:bg-slate-900/40 backdrop-blur-md",
    border: "border border-indigo-300/40 dark:border-indigo-700/30",
    shadow: "shadow-xl",
    label: "Processing",
  },
  listening: {
    size: "w-44 h-44",
    bg: "bg-gradient-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-950",
    border: "border-2 border-emerald-200/60 dark:border-emerald-800/40",
    shadow: "shadow-lg shadow-emerald-500/10",
    label: "Listening",
  },
  idle: {
    size: "w-44 h-44",
    bg: "bg-white dark:bg-slate-900",
    border: "border border-slate-200 dark:border-slate-700",
    shadow: "shadow-md",
    label: "Ready",
  },
};

/*
  ==========================================
  Small focused visual components
  memo() used to avoid unnecessary re-renders
  ==========================================
*/

const AIWaveform = memo(() => (
  <div className="flex items-center gap-2 h-20">
    {Array.from({ length: 5 }).map((_, i) => (
      <div
        key={i}
        className="w-2.5 rounded-full bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-400 dark:to-indigo-300"
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-3 w-4 h-4 bg-indigo-500 rounded-full shadow-[0_0_16px_rgba(99,102,241,0.9)]" />
    </div>
    <div className="w-2 h-2 rounded-full bg-indigo-400/50 dark:bg-indigo-500/50" />
  </div>
));

const IdleListeningIndicator = memo(({ listening }) => {
  if (listening) {
    return (
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-emerald-400/30 dark:bg-emerald-500/20 animate-ping" />
        <Mic className="relative z-10 h-12 w-12 text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  return <div className="h-5 w-5 rounded-full bg-slate-400 dark:bg-slate-600 animate-pulse" />;
});

const UserWaveform = memo(() => {
  // Define heights for the bars to create a "vanishing at ends" bell-curve shape
  const barHeights = ["h-3", "h-5", "h-8", "h-11", "h-full", "h-full", "h-11", "h-8", "h-5", "h-3"];

  return (
    // 'items-center' ensures the bars are vertically centered (originating from middle line)
    <div className="flex items-center gap-1.5 h-16 px-4 py-2">
      {barHeights.map((heightClass, i) => (
        <div 
          key={i} 
          className={`w-1 ${heightClass} flex items-center justify-center`}
        >
          <div
            className="w-full rounded-full bg-gradient-to-t from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300"
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
    <div className="w-28 h-28 mb-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/40 dark:to-indigo-950/20 flex items-center justify-center border border-indigo-200/50 dark:border-indigo-800/30">
      <Mic className="w-12 h-12 text-indigo-500 dark:text-indigo-400 opacity-60" />
    </div>
    <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-200">Ready to Talk</h3>
    <p className="mt-3 text-slate-600 dark:text-slate-400 max-w-sm">
      Click <span className="font-semibold text-emerald-600 dark:text-emerald-400">Start Conversation</span> to begin
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
    <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100/50 to-slate-50 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-500 overflow-hidden">
      <style>{ANIMATIONS}</style>

      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/30 dark:bg-indigo-900/15 blur-[120px] animate-pulse" />
      </div>

      {!hasStarted ? (
        <EmptyState />
      ) : (
        <div className="relative z-10 flex flex-col items-center">
          <div
            className={`relative flex items-center justify-center rounded-full transition-all duration-700 ${config.size} ${config.bg} ${config.border}`}
          >
            {aiState === "speaking" && <AIWaveform />}
            {aiState === "thinking" && <ThinkingIndicator />}
            {(aiState === "idle" || aiState === "listening") && (
              <IdleListeningIndicator listening={aiState === "listening"} />
            )}
          </div>

          <p className="mt-10 text-xs uppercase tracking-[0.25em] font-semibold text-slate-500 dark:text-slate-400">
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