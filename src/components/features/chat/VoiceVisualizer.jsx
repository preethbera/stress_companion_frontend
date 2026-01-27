import React from "react";
import { Mic } from "lucide-react";

export function VoiceVisualizer({ aiState, isUserSpeaking }) {
  return (
    <div className="relative flex-1 w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl border border-slate-700">
      
      {/* === BACKGROUND AMBIENCE === */}
      {/* Soft gradient blobs that move slowly */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '4s' }}></div>
         <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '7s' }}></div>
      </div>

      {/* === AI ANIMATION (Central) === */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* The Core Circle */}
        <div className={`relative flex items-center justify-center transition-all duration-500 ${aiState === 'speaking' ? 'scale-110' : 'scale-100'}`}>
           
           {/* Ripple Effect (Active when AI speaks) */}
           {aiState === 'speaking' && (
             <>
               <div className="absolute w-32 h-32 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }}></div>
               <div className="absolute w-48 h-48 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
             </>
           )}

           {/* Central Orb */}
           <div className={`h-24 w-24 rounded-full bg-gradient-to-tr from-blue-400 to-purple-500 shadow-[0_0_50px_rgba(59,130,246,0.5)] flex items-center justify-center transition-transform duration-300`}>
              {/* Simple Dots for "Thinking" state */}
              {aiState === 'thinking' ? (
                 <div className="flex gap-1">
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                 </div>
              ) : (
                <div className="h-full w-full rounded-full bg-white/10 backdrop-blur-sm" /> 
              )}
           </div>
        </div>
        
        <p className="mt-8 text-slate-300 font-medium tracking-wide text-sm uppercase">
          {aiState === 'speaking' ? "AI Speaking..." : aiState === 'thinking' ? "Processing..." : "Listening..."}
        </p>
      </div>

      {/* === USER SPEAKING INDICATOR (Small Animation) === */}
      {/* This appears only when the user is speaking */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-300 ${isUserSpeaking ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
         <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <Mic className="h-4 w-4 text-green-400" />
            <div className="flex items-end gap-1 h-4">
               {/* Simulated Waveform Bars */}
               <span className="w-1 bg-green-400 rounded-full animate-[bounce_1s_infinite] h-2"></span>
               <span className="w-1 bg-green-400 rounded-full animate-[bounce_1.2s_infinite] h-4"></span>
               <span className="w-1 bg-green-400 rounded-full animate-[bounce_0.8s_infinite] h-3"></span>
               <span className="w-1 bg-green-400 rounded-full animate-[bounce_1.1s_infinite] h-2"></span>
            </div>
         </div>
      </div>
    </div>
  );
}