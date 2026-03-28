import { useState, useEffect, useRef, useCallback } from "react";
import { AudioStreamer } from "@/core/audio/AudioStreamer";
import { SpeechService } from "@/core/audio/SpeechService";
import { TTSEngine } from "@/core/audio/TTSEngine";
import { useSessionStore } from "@/store/useSessionStore";

export function useVoiceAgent({ deviceId, onResult, onInterrupt }) {
  // ==========================================
  // TEMPORARY OVERRIDE
  // Delete this single line in the future when STT supports specific hardware.
  // Forcing undefined ensures AudioStreamer fetches the OS default mic, 
  // keeping it perfectly synced with the Web Speech API's limitations.
  // ==========================================
  deviceId = undefined; 

  // --- Zustand State ---
  const isMicOn = useSessionStore((state) => state.isMicOn);
  const setIsMicOn = useSessionStore((state) => state.setIsMicOn);
  const setAiState = useSessionStore((state) => state.setAiState);

  // --- React State ---
  const [transcript, setTranscript] = useState(""); 
  const [volume, setVolume] = useState(0);

  // --- Core Engine Refs ---
  const streamRef = useRef(null);
  const speechRef = useRef(null);
  const ttsRef = useRef(null);
  const analyzerRef = useRef(null);
  const animFrameRef = useRef(null);

  const latestCallbacks = useRef({ onResult, onInterrupt });

  useEffect(() => {
    latestCallbacks.current = { onResult, onInterrupt };
  }, [onResult, onInterrupt]);

  // ==========================================
  // 1. INITIALIZE ENGINES ON MOUNT
  // ==========================================
  useEffect(() => {
    ttsRef.current = new TTSEngine(
      () => setAiState("speaking"), 
      () => {
        // Only set idle if we haven't already transitioned to another intended state
        const currentAiState = useSessionStore.getState().aiState;
        if (currentAiState === "speaking") {
          setAiState("idle");
        }
      }
    );

    speechRef.current = new SpeechService(
      (text) => setTranscript(text),
      (err) => console.error("SpeechService encountered an error:", err)
    );

    return () => {
      if (speechRef.current) speechRef.current.stop();
      if (ttsRef.current) ttsRef.current.cancel();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (analyzerRef.current) analyzerRef.current.stop();
      if (streamRef.current) AudioStreamer.stopStream(streamRef.current);
    };
  }, []);

  // ==========================================
  // 2. MASTER CONTROLS
  // ==========================================
  const startAgent = useCallback(async () => {
    if (useSessionStore.getState().isMicOn) return;

    try {
      const stream = await AudioStreamer.getStream(deviceId);
      streamRef.current = stream;

      if (speechRef.current) speechRef.current.start(); 

      analyzerRef.current = AudioStreamer.createVolumeAnalyzer(stream);
      const updateVolume = () => {
        if (analyzerRef.current) {
          setVolume(analyzerRef.current.getVolume());
          animFrameRef.current = requestAnimationFrame(updateVolume);
        }
      };
      updateVolume();

      setIsMicOn(true);
      setAiState("listening");
    } catch (err) {
      console.error("useVoiceAgent: Failed to start audio hardware", err);
      setIsMicOn(false);
      setAiState("idle");
    }
  }, [deviceId, setIsMicOn, setAiState]);

  const stopAgent = useCallback(() => {
    if (!useSessionStore.getState().isMicOn) return "";

    const finalSpokenText = speechRef.current?.finalTranscript.trim() || "";

    if (speechRef.current) speechRef.current.stop();

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (analyzerRef.current) {
      analyzerRef.current.stop();
      analyzerRef.current = null;
    }

    if (streamRef.current) {
      AudioStreamer.stopStream(streamRef.current);
      streamRef.current = null;
    }

    setIsMicOn(false);
    setVolume(0);
    setTranscript("");

    if (speechRef.current) speechRef.current.clearTranscript();
    
    return finalSpokenText;
  }, [setIsMicOn]);

  // ==========================================
  // 3. UTILITIES EXPOSED TO UI
  // ==========================================
  const clearTranscript = useCallback(() => {
    if (speechRef.current) speechRef.current.clearTranscript();
    setTranscript("");
  }, []);

  const speak = useCallback((text) => {
    if (ttsRef.current) ttsRef.current.speak(text);
  }, []);

  const cancelSpeech = useCallback(() => {
    if (ttsRef.current) ttsRef.current.cancel();
  }, []);

  return {
    volume,
    transcript, 
    startAgent, 
    stopAgent, 
    clearTranscript, 
    speak, 
    cancelSpeech, 
  };
}