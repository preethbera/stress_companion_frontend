import { useState, useEffect, useRef, useCallback } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition({ onResult, onEnd }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const recognitionRef = useRef(null);
  
  // Refs keep track of the latest callbacks without restarting the effect
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
  });

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      // Logic to handle both interim and final results if you want real-time typing effect
      // But based on your code, simple access is fine:
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (onResultRef.current) onResultRef.current(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      setIsMicOn(false);
    };

    recognition.onend = () => {
      setIsMicOn(false);
      if (onEndRef.current) onEndRef.current();
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }
    try {
      recognitionRef.current.start();
      setIsMicOn(true);
    } catch (e) {
      // Ignored: likely already started
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsMicOn(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isMicOn) stopListening();
    else startListening();
  }, [isMicOn, startListening, stopListening]);

  return { isMicOn, toggleMic, startListening, stopListening };
}