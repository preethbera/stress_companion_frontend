import { useState, useEffect } from "react";
// Adjust these imports to match your project structure
import { AudioStreamer } from "@/core/audio/AudioStreamer"; 
import { useSessionStore } from "@/store/useSessionStore"; 

export function useMicrophoneStep() {
  // Local state to store fetched microphones
  const [audioInputs, setAudioInputs] = useState([]);
  
  // Local UI states (Keep these local, as they only matter while testing the mic)
  const [volume, setVolume] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false);

  // 1. Fetch data and actions directly from Zustand
  const micDeviceId = useSessionStore((state) => state.hardwareConfig.micDeviceId);
  const setHardwareConfig = useSessionStore((state) => state.setHardwareConfig);

  // 2. Fetch Microphones directly from the class method
  useEffect(() => {
    let isMounted = true;

    const fetchMics = async () => {
      try {
        const mics = await AudioStreamer.getMicrophones();
        if (isMounted) {
          setAudioInputs(mics);
        }
      } catch (error) {
        console.error("Failed to fetch microphones:", error);
      }
    };

    fetchMics();

    // Listen for devices being plugged in or removed
    navigator.mediaDevices.addEventListener("devicechange", fetchMics);
    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", fetchMics);
    };
  }, []);

  // 3. Auto-select first mic and push to global store
  useEffect(() => {
    if (audioInputs.length > 0 && !micDeviceId) {
      setHardwareConfig({ micDeviceId: audioInputs[0].deviceId });
    }
  }, [audioInputs, micDeviceId, setHardwareConfig]);

  // 4. Audio Volume stream (Reacts automatically if micDeviceId changes in Zustand)
  useEffect(() => {
    if (!micDeviceId) return;

    let audioContext, analyser, microphone, dataArray, animationId;
    let currentStream = null;

    const startAudio = async () => {
      try {
        currentStream = await AudioStreamer.getStream(micDeviceId);

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(currentStream);

        microphone.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setVolume(sum / dataArray.length);
          animationId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (e) {
        console.error("Audio volume error:", e);
      }
    };

    startAudio();

    // 5. Cleanup
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
      if (currentStream) AudioStreamer.stopStream(currentStream);
    };
  }, [micDeviceId]);

  // 6. Check if user has spoken
  useEffect(() => {
    if (volume > 20 && !hasSpoken) {
      setHasSpoken(true);
    }
  }, [volume, hasSpoken]);

  // Return the local states and available inputs for the UI
  return { audioInputs, volume, hasSpoken };
}