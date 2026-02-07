import { useState, useEffect, useRef } from "react";

const THERMAL_FEED_URL = "http://127.0.0.1:8001/video_feed";

export function useThermalCamera({ isActive = true } = {}) {
  const cameraRef = useRef(null); 
  const [stream, setStream] = useState(null); 
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setStream(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Set the stream URL with timestamp to force reload
    const streamUrl = `${THERMAL_FEED_URL}?t=${Date.now()}`;
    setStream(streamUrl);

    // 2. SAFETY TIMEOUT: Force loading to false after 3 seconds 
    // (This fixes the "infinite spinner" if the onLoad event fails)
    const safetyTimer = setTimeout(() => {
        setIsLoading(false);
    }, 3000);

    if (cameraRef.current) {
      cameraRef.current.crossOrigin = "anonymous";
      cameraRef.current.src = streamUrl;

      cameraRef.current.onload = () => {
        setIsLoading(false);
        clearTimeout(safetyTimer); // Clear timeout if successful
      };
      
      cameraRef.current.onerror = () => {
        // Don't show error immediately if it's just a connection blip
        // setError("Could not connect to thermal feed.");
        setIsLoading(false); 
      };
    }

    return () => clearTimeout(safetyTimer);
  }, [isActive]);

  return { videoRef: cameraRef, stream, error, isLoading };
}