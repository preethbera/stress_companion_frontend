import { useState, useCallback } from "react";
import { chatClient } from "@/core/network/ChatClient";
import { useSessionStore } from "@/store/useSessionStore";
import { LLM_MODELS, API_ENDPOINTS } from "@/config/api";

export function useChatApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const selectedModel = useSessionStore((state) => state.selectedModel);

  const sendMessage = useCallback(async (userText) => {
    setIsLoading(true);
    setError(null);

    const modelConfig = LLM_MODELS.find(m => m.id === selectedModel);
    const endpoint = modelConfig ? modelConfig.endpoint : API_ENDPOINTS.CHAT_LOCAL;

    try {
      // Defer to the pure JS singleton
      const reply = await chatClient.sendMessage(userText, endpoint);
      return reply;
    } catch (err) {
      setError("I'm having trouble connecting right now.");
      return "I'm sorry, I'm having trouble connecting right now.";
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  return { sendMessage, isLoading, error };
}