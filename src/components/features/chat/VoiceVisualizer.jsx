import React from "react";
import { Mic } from "lucide-react";

export function VoiceVisualizer({ aiState, isUserSpeaking, hasStarted }) {
  // We inject some custom keyframes for the waveform animations
  const styleSheet = `
    @keyframes ai-wave {
      0%, 100% { height: 10%; opacity: 0.5; }
      50% { height: 100%; opacity: 1; }
    }
    @keyframes user-wave {
      0%, 100% { height: 20%; opacity: 0.5; }
      50% { height: 100%; opacity: 1; }
    }
  `;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-500">
      <style>{styleSheet}</style>

      {/* --- Background Ambience --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/40 dark:bg-blue-900/10 rounded-full blur-[80px]" />
      </div>

      {/* --- Main Content --- */}
      {!hasStarted ? (
        // --- 1. EMPTY STATE MESSAGE ---
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-700">
             <div className="w-24 h-24 mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                 <Mic className="w-10 h-10 text-indigo-400 opacity-50" />
             </div>
             <p className="text-xl font-medium text-slate-600 dark:text-slate-300">
                Click on the <span className="text-green-600 font-bold">Start Conversation</span> button below to start...
             </p>
        </div>
      ) : (
        // --- 2. ACTIVE VISUALIZER ---
        <>
            <div className="relative z-10 flex flex-col items-center justify-center">
                
                {/* The Container */}
                <div
                className={`
                    relative flex items-center justify-center rounded-full transition-all duration-700 ease-in-out
                    ${
                    aiState === "speaking"
                        ? "w-64 h-64 bg-gradient-to-b from-indigo-50/80 to-white/50 dark:from-slate-900/80 dark:to-slate-950/50 shadow-[0_0_80px_rgba(99,102,241,0.25)] border border-indigo-100 dark:border-indigo-900/50"
                        : aiState === "thinking"
                        ? "w-48 h-48 bg-white/10 dark:bg-slate-900/30 backdrop-blur-sm border border-indigo-200/30 dark:border-indigo-800/30 shadow-lg"
                        : "w-40 h-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                    }
                `}
                >
                {/* CONTENT: AI SPEAKING (Waveform) */}
                {aiState === "speaking" && (
                    <div className="flex items-center gap-2 h-32">
                    {[...Array(5)].map((_, i) => (
                        <div
                        key={i}
                        className="w-4 bg-indigo-500 dark:bg-indigo-400 rounded-full"
                        style={{
                            animation: "ai-wave 1.2s ease-in-out infinite",
                            animationDelay: `${i * 0.15}s`,
                        }}
                        />
                    ))}
                    </div>
                )}

                {/* CONTENT: AI THINKING (Orbiting Dot) */}
                {aiState === "thinking" && (
                    <div className="absolute inset-0 rounded-full animate-[spin_3s_linear_infinite]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-3 h-3 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                    <div className="absolute inset-2 border border-indigo-500/10 rounded-full" />
                    </div>
                )}

                {/* CONTENT: AI IDLE/LISTENING (Static or Icon) */}
                {(aiState === "idle" || aiState === "listening") && (
                    <div className={`transition-all duration-500 ${aiState === 'listening' ? 'scale-110' : 'scale-100'}`}>
                    {aiState === "listening" ? (
                        <div className="relative">
                        <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping" />
                        <Mic className="h-10 w-10 text-green-600 dark:text-green-400 relative z-10" />
                        </div>
                    ) : (
                        <div className="h-4 w-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
                    )}
                    </div>
                )}
                </div>

                {/* State Label */}
                <p className="mt-8 font-medium tracking-[0.2em] text-xs uppercase text-slate-400 dark:text-slate-500 transition-all duration-300">
                {aiState === "speaking"
                    ? "AI Speaking"
                    : aiState === "thinking"
                    ? "Processing"
                    : aiState === "listening"
                    ? "Listening"
                    : "Ready"}
                </p>
            </div>

            {/* --- User Speaking Visual (Bottom Center) --- */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 h-12 flex flex-col items-center justify-end pointer-events-none">
                {isUserSpeaking && (
                <div className="flex items-end gap-1 h-8 mb-2">
                    {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-green-500 rounded-full"
                        style={{
                        animation: "user-wave 0.5s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`,
                        }}
                    />
                    ))}
                </div>
                )}
            </div>
        </>
      )}
    </div>
  );
}