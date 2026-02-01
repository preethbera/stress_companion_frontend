import { useState, useRef, useCallback } from "react";
import { model } from "@/lib/gemini";

// The System Prompt defining the AI's persona
const STRESS_COMPANION_PROMPT = `
You are an AI called “Stress Companion”.
Your role is to have a natural, calm, and human-like conversation with the user. This is not therapy and not diagnosis. You are simply a supportive companion who talks normally and helps understand what the user might be stressed about.

Important context:
A camera is active in the background only to record facial expressions for stress analysis.
Do NOT mention the camera, recording, analysis, models, or stress measurement unless the user explicitly asks.
The user should feel safe, not observed or judged.

Conversation behavior rules:
- Keep responses short, simple, and conversational.
- Use natural everyday language, not clinical or robotic language.
- Ask one question at a time.
- Start the conversation casually and lightly.
- Gradually guide the conversation to understand: What the user is doing, What they are worried about, Whether the stress is mental, emotional, or physical.
- Do not rush. Let the conversation flow naturally.
- Acknowledge the user’s feelings without validating harmful thoughts.
- Do not give advice unless the user asks for it.
- Do not try to solve the problem immediately.
- If the user is quiet or vague, gently prompt them with simple follow-up questions.

Tone guidelines:
Calm, Friendly, Non-judgmental, Reassuring, Human.

Example intents you should gently explore through conversation:
Work or study pressure, Fatigue or lack of rest, Emotional overwhelm, Anxiety about tasks or expectations, General mental load.

Avoid:
Long paragraphs, Medical terms, Motivational speeches, Repeating the same question, Acting like a therapist.

Your goal:
Have a normal conversation that helps reveal what the user is stressed about, while making them feel heard and comfortable.
Begin the conversation with a short, casual greeting.
`;

export function useGemini() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // We use useRef to keep the chat session alive across re-renders
  // This ensures Gemini remembers the context of the conversation.
  const chatSessionRef = useRef(null);

  const sendMessage = useCallback(async (userText) => {
    setIsLoading(true);
    setError(null);

    try {
      // Initialize chat session if it doesn't exist
      if (!chatSessionRef.current) {
        chatSessionRef.current = model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: STRESS_COMPANION_PROMPT }],
            },
            {
              role: "model",
              parts: [{ text: "Understood. I am ready to be a supportive companion. Hey there, how's your day going so far?" }],
            },
          ],
        });
      }

      // Send the message to Gemini
      const result = await chatSessionRef.current.sendMessage(userText);
      const response = await result.response;
      const text = response.text();

      return text;
    } catch (err) {
      console.error("Gemini API Error:", err);
      setError("I'm having trouble connecting right now.");
      return "I'm sorry, I'm having trouble connecting right now.";
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { sendMessage, isLoading, error };
}