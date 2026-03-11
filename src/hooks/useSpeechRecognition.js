import { useState, useEffect, useRef, useCallback } from "react";

const SpeechRecognition =
  typeof window !== "undefined" &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

export function useSpeechRecognition({ deviceId, onResult, onEnd }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const recognitionRef = useRef(null);
  
  // Refs keep track of the latest callbacks without causing effect re-runs
  const onResultRef = useRef(onResult);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
    onEndRef.current = onEnd;
  }, [onResult, onEnd]);

  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    /* NOTE: The native Web Speech API ignores `deviceId`. It uses the system default. 
      We accept `deviceId` as a prop so the parent architecture remains solid 
      for future upgrades to custom AudioContext/STT providers.
    */

    recognition.onresult = (event) => {
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
      // abort() is safer than stop() during cleanup to prevent hanging events
      recognition.abort(); 
    };
  }, []); 

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition is not supported in this browser.");
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
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsMicOn(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (isMicOn) stopListening();
    else startListening();
  }, [isMicOn, startListening, stopListening]);

  return { isMicOn, toggleMic, startListening, stopListening };
}