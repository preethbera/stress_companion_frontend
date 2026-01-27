import React, { useState, useEffect } from "react";
import { Mic, MicOff, PhoneOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { VoiceVisualizer } from "@/components/features/chat/VoiceVisualizer";
import { ConversationPanel } from "@/components/features/chat/ConversationPanel";

export default function ChatPage() {
  const navigate = useNavigate();
  
  // State Management
  const [messages, setMessages] = useState([
    { id: Date.now(), role: "assistant", content: "Welcome to your Stress Companion session. How are you feeling today?" }
  ]);
  const [input, setInput] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);
  
  // AI State: 'idle' | 'listening' | 'thinking' | 'speaking'
  const [aiState, setAiState] = useState('idle');

  // Handle Text Sending
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // 1. Add User Message
    const userMsg = { id: Date.now(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    
    // 2. Simulate AI Processing
    setAiState('thinking');
    
    setTimeout(() => {
      // 3. Simulate AI Speaking Response
      setAiState('speaking');
      const aiResponse = { 
        id: Date.now(), 
        role: "assistant", 
        content: "I understand that can be difficult. Let's take a deep breath together. Tell me more about what triggered this feeling." 
      };
      setMessages(prev => [...prev, aiResponse]);

      // 4. Return to Idle after "speaking"
      setTimeout(() => setAiState('idle'), 4000); // AI speaks for 4 seconds
    }, 1500); // Thinking time
  };

  // Toggle Microphone (Simulates User Speaking)
  const toggleMic = () => {
    const newState = !isMicOn;
    setIsMicOn(newState);
    
    // If turning ON, simulate user speaking activity
    if (newState) {
      setAiState('listening'); // AI is listening to you
    } else {
      setAiState('idle');
    }
  };

  const endSession = () => {
    // Logic to save session summary could go here
    navigate("/dashboard");
  };

  return (
    // Main Container - Full height minus Navbar/Padding
    <div className="h-[calc(100vh-100px)] w-full max-w-7xl mx-auto py-4 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* LEFT COLUMN: Voice Visualizer (Spans 2 cols on Large screens) */}
        <div className="lg:col-span-2 flex flex-col gap-4 h-full">
          
          {/* 1. Visualizer Area */}
          <VoiceVisualizer 
            aiState={aiState} 
            isUserSpeaking={isMicOn} // We assume if Mic is ON, user is "active"
          />

          {/* 2. Control Bar */}
          <div className="flex items-center gap-4">
            <Button 
              size="lg" 
              className={`flex-1 h-14 text-lg font-medium transition-all ${
                isMicOn 
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 shadow-lg" 
                : "bg-secondary hover:bg-secondary/80 text-foreground"
              }`}
              onClick={toggleMic}
            >
              {isMicOn ? (
                <>
                  <Mic className="mr-2 h-5 w-5 animate-pulse" /> Microphone On
                </>
              ) : (
                <>
                  <MicOff className="mr-2 h-5 w-5" /> Microphone Off
                </>
              )}
            </Button>

            <Button 
              size="lg" 
              variant="destructive"
              className="flex-1 h-14 text-lg font-medium shadow-red-500/20 shadow-lg"
              onClick={endSession}
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              End Session
            </Button>
          </div>
        </div>

        {/* RIGHT COLUMN: Conversation Panel (Spans 1 col) */}
        <div className="h-full hidden lg:block">
          <ConversationPanel 
            messages={messages} 
            input={input}
            setInput={setInput}
            onSendMessage={handleSendMessage}
          />
        </div>

        {/* MOBILE ONLY: Conversation Sheet or stacked view? 
            For now, on mobile, the conversation panel appears below controls.
        */}
        <div className="h-[400px] lg:hidden">
           <ConversationPanel 
            messages={messages} 
            input={input}
            setInput={setInput}
            onSendMessage={handleSendMessage}
          />
        </div>

      </div>
    </div>
  );
}