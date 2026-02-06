import React, { useRef, useEffect } from "react";
import { Send, User, Sparkles, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ConversationPanel({
  messages,
  input,
  setInput,
  onSendMessage,
  hasStarted,
}) {
  const scrollEndRef = useRef(null);
  const inputRef = useRef(null);

  // Optimization: Only auto-scroll if messages change
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, [messages]);

  // Optimization: Auto-scroll input text to the right for long queries
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = inputRef.current.scrollWidth;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && hasStarted) {
        onSendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-card border-l border-border/40 overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-muted/20 px-6">
        <div className="flex items-center gap-3">
          <ScrollText className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight">
            Session Transcript
          </h2>
        </div>
      </div>

      {/* 2. MESSAGES AREA (Scrollable) */}
      <ScrollArea className="flex-1 h-full min-h-0">
        {/* Empty State */}
        {!hasStarted && messages.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Click on the{" "}
              <span className="font-semibold text-primary">
                Start Conversation
              </span>{" "}
              button to start...
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="flex flex-col gap-6 py-4 px-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={cn(
                  "flex gap-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* User/Bot Icon */}
                <Avatar className="h-8 w-8 shrink-0 border shadow-sm">
                  <AvatarFallback
                    className={cn(
                      "text-xs font-medium",
                      msg.role === "assistant"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    msg.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 text-sm shadow-sm break-words whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-muted/50 border text-foreground rounded-2xl rounded-tl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {/* Invisible div to anchor scroll to bottom */}
            <div ref={scrollEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* 3. INPUT FOOTER - UPDATED */}
      <div className="p-4 bg-background border-t shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage();
          }}
          className="relative flex items-center"
        >
          <Input
            ref={inputRef}
            placeholder={
              hasStarted ? "Type a message..." : "Start session first..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!hasStarted}
            // Added pr-14 to prevent text from typing under the button
            className="bg-muted/30 border-transparent focus:border-primary/20 shadow-none focus-visible:ring-0 h-12 pl-4 pr-14 rounded-xl transition-all text-foreground placeholder:text-muted-foreground"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || !hasStarted}
            className={cn(
              // Changed positioning to strictly center vertically
              "absolute right-1 top-1/2 -translate-y-1/2  size-10 rounded-lg transition-all duration-200",
              input.trim() ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
          >
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}