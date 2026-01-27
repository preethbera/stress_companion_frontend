import React, { useRef, useEffect } from "react";
import { Send, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function ConversationPanel({ messages, input, setInput, onSendMessage }) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-card rounded-3xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h2 className="font-semibold text-lg">Conversation</h2>
        <p className="text-xs text-muted-foreground">Live Transcription</p>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className={msg.role === "assistant" ? "bg-primary/10 text-primary" : "bg-muted"}>
                  {msg.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              
              <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-4 py-2 text-sm max-w-[280px] shadow-sm ${
                  msg.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-muted/50 border rounded-tl-sm"
                }`}>
                  {msg.content}
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {new Date(msg.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 bg-background border-t">
        <form 
          onSubmit={(e) => { e.preventDefault(); onSendMessage(); }}
          className="flex gap-2"
        >
          <Input 
            placeholder="Type a message..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-muted/30"
          />
          <Button type="submit" size="icon" disabled={!input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}