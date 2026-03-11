import { useState, useEffect, useRef } from "react";

/**
 * A universal hook to manage any webcam stream (Optical or Thermal).
 * * @param {string} deviceId - The specific camera ID chosen during setup.
 * @param {boolean} isOptedOut - Whether the user chose to skip this camera.
 * @param {boolean} isActive - Whether the chat session is currently active.
 */
export function useWebcamStream(deviceId, isOptedOut, isActive) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. GATEKEEPER: If user skipped this camera, or the chat hasn't started yet, do nothing.
    if (!isActive || isOptedOut || !deviceId) {
      if (stream) {
        // Stop all tracks if the session ends or is toggled off
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      return;
    }

    let isMounted = true;
    let localStream = null;
    setIsLoading(true);
    setError(null);

    // 2. FETCH STREAM: Request the specific device ID from the browser
    navigator.mediaDevices.getUserMedia({
      video: { 
        deviceId: { exact: deviceId }, 
        width: { ideal: 640 }, 
        height: { ideal: 480 } 
      }
    })
    .then(s => {
      localStream = s;
      if (isMounted) {
        setStream(s);
        setIsLoading(false);
        // Safely attach the stream to the hidden video element for processing
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } else {
        // Cleanup if the component unmounted while we were waiting for the camera
        s.getTracks().forEach(t => t.stop());
      }
    })
    .catch(err => {
      if (isMounted) {
        setError(err.message || "Failed to access camera");
        setIsLoading(false);
        console.error(`Webcam Stream Error (Device: ${deviceId}):`, err);
      }
    });

    // 3. CLEANUP: When the component unmounts, release the camera hardware
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [deviceId, isOptedOut, isActive]); // Re-run only if these settings change

  return { videoRef, stream, error, isLoading };
}