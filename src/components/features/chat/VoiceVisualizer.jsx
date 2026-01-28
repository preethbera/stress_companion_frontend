import React from "react";
import { Mic } from "lucide-react";

export function VoiceVisualizer({ aiState, isUserSpeaking }) {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/40 rounded-full blur-[120px] animate-pulse"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-900/20 rounded-full blur-[100px]"></div>
      </div>

      {/* User Speaking Radar */}
      {isUserSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className="absolute w-64 h-64 border border-green-500/30 rounded-full animate-[ping_2s_linear_infinite]"></div>
           <div className="absolute w-96 h-96 border border-green-500/20 rounded-full animate-[ping_2s_linear_infinite]" style={{ animationDelay: '0.5s' }}></div>
        </div>
      )}

      {/* AI Orb */}
      <div className="relative z-10 flex flex-col items-center justify-center transition-all duration-700">
        <div className={`
          relative flex items-center justify-center rounded-full transition-all duration-500
          ${aiState === 'speaking' ? 'w-48 h-48 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-[0_0_100px_rgba(59,130,246,0.6)]' : 
            aiState === 'listening' ? 'w-32 h-32 bg-slate-800 border-2 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]' :
            'w-32 h-32 bg-slate-900 border border-slate-700'}
        `}>
           {aiState === 'speaking' ? (
             <div className="w-full h-full rounded-full opacity-50 animate-pulse bg-white/20"></div>
           ) : aiState === 'listening' ? (
             <Mic className="h-10 w-10 text-green-400 animate-pulse" />
           ) : (
             <div className="w-3 h-3 bg-slate-500 rounded-full"></div>
           )}
        </div>

        <p className="mt-8 font-medium tracking-widest text-sm uppercase text-slate-400">
          {aiState === 'speaking' ? "Speaking..." : 
           aiState === 'listening' ? "Listening..." : 
           aiState === 'thinking' ? "Thinking..." : "Ready"}
        </p>
      </div>
    </div>
  );
}