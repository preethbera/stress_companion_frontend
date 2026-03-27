import { useState, useCallback, useRef } from "react";
import { chatClient } from "@/core/network/ChatClient";
import { useSessionStore } from "@/store/useSessionStore";
import { LLM_MODELS, API_ENDPOINTS } from "@/config/api";

export function useChatApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);
  
  const selectedModel = useSessionStore((state) => state.selectedModel);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const sendMessage = useCallback(async (userText) => {
    abort(); // cancel previous request if any
    setIsLoading(true);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const modelConfig = LLM_MODELS.find(m => m.id === selectedModel);
    const endpoint = modelConfig ? modelConfig.endpoint : API_ENDPOINTS.CHAT_LOCAL;

    try {
      const reply = await chatClient.sendMessage(userText, endpoint, { signal: controller.signal });
      return reply;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err; // hook can catch this or ignore
      }
      setError("I'm having trouble connecting right now.");
      return "I'm sorry, I'm having trouble connecting right now.";
    } finally {
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [selectedModel, abort]);

  return { sendMessage, abort, isLoading, error };
}