import { useState, useCallback } from "react";
import { chatClient } from "@/core/network/ChatClient";

export function useChatApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (userText) => {
    setIsLoading(true);
    setError(null);

    try {
      // Defer to the pure JS singleton
      const reply = await chatClient.sendMessage(userText);
      return reply;
    } catch (err) {
      setError("I'm having trouble connecting right now.");
      return "I'm sorry, I'm having trouble connecting right now.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}