import { useState, useCallback } from "react";

export function useTextToSpeech({ onSpeakStart, onSpeakEnd }) {
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;

    // Cancel current speech to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1.2;
    utterance.pitch = 1;

    utterance.onstart = () => {
      if (onSpeakStart) onSpeakStart();
    };

    utterance.onend = () => {
      if (onSpeakEnd) onSpeakEnd();
    };

    window.speechSynthesis.speak(utterance);
  }, [onSpeakStart, onSpeakEnd]);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis.cancel();
  }, []);

  return { speak, cancelSpeech };
}