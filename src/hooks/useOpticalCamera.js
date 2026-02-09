import { useState, useEffect, useRef } from "react";

export function useOpticalCamera({ isActive = true } = {}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Reset State on Toggle
    if (!isActive) {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setStream(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const startCamera = async () => {
      try {
        // --- STEP A: List all cameras ---
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Debug: Log what the browser sees (Check your console to see camera names!)
        console.log("Available Cameras:", videoDevices.map(d => d.label));

        // --- STEP B: Smart Select the Laptop Camera ---
        // We look for keywords common to built-in laptop cameras.
        // If we don't find one, we fall back to the first available camera.
        const laptopCamera = videoDevices.find(device => 
          device.label.toLowerCase().includes("integrated") || 
          device.label.toLowerCase().includes("facetime") || 
          device.label.toLowerCase().includes("built-in") ||
          device.label.toLowerCase().includes("webcam")
        );

        // Define constraints based on whether we found a specific ID
        const constraints = {
          video: {
            // If we found the laptop camera, use its specific ID.
            // Otherwise, ask for "user" facing mode and hope for the best.
            deviceId: laptopCamera ? { exact: laptopCamera.deviceId } : undefined,
            facingMode: laptopCamera ? undefined : "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        };

        // --- STEP C: Request the Stream ---
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Hardware Disconnect Listener
        const videoTrack = mediaStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          if (isMounted) {
            console.warn("Optical Camera Disconnected (Hardware level)");
            setError("Camera disconnected unexpectedly.");
            setStream(null);
          }
        };

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Optical Camera Error:", err);
        if (isMounted) {
          // Improve error message if it looks like a "Device Busy" error
          if (err.name === "NotReadableError" || err.name === "TrackStartError") {
             setError("Camera is busy. Is another app (or the thermal backend) using it?");
          } else {
             setError("Camera access denied or unavailable.");
          }
          setStream(null); 
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    startCamera();

    // Cleanup
    return () => {
      isMounted = false;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  return { videoRef, stream, error, isLoading };
}