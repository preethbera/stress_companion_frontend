import React from "react";
import { ScrollText, MessageSquare } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

// AI Elements Imports
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

export function ConversationPanel({
  messages,
  input,
  setInput,
  onSendMessage,
}) {
  const hasStarted = useSessionStore(
    (state) => state.conversationStatus === "started",
  );

  const handleSubmit = () => {
    // The PromptInput handles the preventDefault internally
    if (input.trim() && hasStarted) {
      onSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      {/* 1. HEADER */}
      <div className="flex shrink-0 items-center px-6 py-4 gap-3 border-b bg-muted/20">
        <ScrollText className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight">
          Session Transcript
        </h2>
      </div>

      {/* 2. CONVERSATION & INPUT AREA */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <Conversation>
          <ConversationContent>
            {!hasStarted && messages.length === 0 ? (
              <ConversationEmptyState
                title="Start a conversation"
                description="Click on the Start Conversation button to begin chatting..."
              />
            ) : (
              messages.map((msg, index) => (
                <Message from={msg.role} key={msg.id || index}>
                  <MessageContent>
                    <MessageResponse>{msg.content}</MessageResponse>
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* 3. PROMPT INPUT FOOTER */}
        <PromptInput onSubmit={handleSubmit} className="p-3 w-full relative">
          <PromptInputTextarea
            value={input}
            placeholder={
              hasStarted ? "Type a message..." : "Start session first..."
            }
            onChange={(e) => setInput(e.currentTarget.value)}
            disabled={!hasStarted}
            className="p-3 bg-muted/30 focus-visible:ring-0"
          />
          <PromptInputSubmit
            disabled={!input.trim() || !hasStarted}
            className="absolute bottom-2 right-2"
          />
        </PromptInput>
      </div>
    </div>
  );
}
