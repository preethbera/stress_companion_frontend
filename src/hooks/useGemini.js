import { useState, useRef, useCallback } from "react";

const API_URL = "http://127.0.0.1:8000/api/v1/chat";

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stable session ID for this browser tab
  const sessionIdRef = useRef(crypto.randomUUID());

  const sendMessage = useCallback(async (userText) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          message: userText,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await response.json();
      return data.reply;
    } catch (err) {
      console.error("Backend error:", err);
      setError("I'm having trouble connecting right now.");
      return "I'm sorry, I'm having trouble connecting right now.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}
