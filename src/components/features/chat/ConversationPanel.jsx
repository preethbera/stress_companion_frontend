import React, { useRef, useEffect } from "react";
import { Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function ConversationPanel({
  messages,
  input,
  setInput,
  onSendMessage,
  hasStarted, 
}) {
  const scrollEndRef = useRef(null);

  useEffect(() => {
    scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      {/* HEADER */}
      <div className="h-16 px-6 border-b bg-muted/20 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-sm">Session Transcript</h2>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-6 w-full custom-scrollbar relative">
        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 99px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
        `}</style>

        {/* 1. EMPTY STATE MESSAGE */}
        {!hasStarted && messages.length === 0 ? (
             <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                 <p className="text-muted-foreground text-sm">
                    Click on the <span className="font-semibold text-primary">Start Conversation</span> button to start...
                 </p>
             </div>
        ) : (
            // 2. MESSAGES LIST
            <div className="flex flex-col gap-6">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                <Avatar className="h-8 w-8 shrink-0 mt-1 border shadow-sm">
                    <AvatarFallback
                    className={
                        msg.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }
                    >
                    {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                    ) : (
                        <Sparkles className="h-4 w-4" />
                    )}
                    </AvatarFallback>
                </Avatar>

                <div
                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%]`}
                >
                    <div
                    className={`px-5 py-3 text-sm shadow-sm leading-relaxed ${
                        msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted/50 border rounded-2xl rounded-tl-sm"
                    }`}
                    >
                    {msg.content}
                    </div>
                </div>
                </div>
            ))}
            <div ref={scrollEndRef} />
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t bg-background shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
          className="flex gap-2 items-center"
        >
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!hasStarted} // Optional: disable input before start
            className="flex-1 bg-muted/30 border-transparent focus:border-primary/20 shadow-none focus-visible:ring-0 h-12 px-6 rounded-full transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || !hasStarted}
            className="h-12 w-12 rounded-full shrink-0 shadow-sm hover:scale-105 transition-transform cursor-pointer"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}