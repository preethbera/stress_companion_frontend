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
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // 1. Generate URL
    const streamUrl = `${THERMAL_FEED_URL}?t=${Date.now()}`;
    
    // 2. Optimistically set stream so UI can try to render (Loading spinner will be active)
    setStream(streamUrl);

    // 3. VALIDATION: Create a hidden tester to check if the server is actually alive.
    // We do this because the 'ref' might not be mounted yet, making it unreliable for error checking.
    const connectionTester = new Image();
    
    connectionTester.onerror = () => {
      console.warn("Thermal Camera Validation Failed: Connection Refused");
      // CRITICAL FIX: Explicitly nullify stream so the Socket Logic knows to stop.
      setStream(null); 
      setError("Thermal camera unavailable");
      setIsLoading(false); 
    };

    // Note: MJPEG streams often don't trigger 'onload', so we rely on a timeout 
    // to assume success if no error occurs quickly.
    connectionTester.src = streamUrl;

    // 4. TIMEOUT: If no error within 2.5 seconds, assume stable connection
    const safetyTimer = setTimeout(() => {
      // Only finish loading if we haven't already failed
      setIsLoading((prev) => {
        if (prev) return false; 
        return prev;
      });
    }, 2500);

    // Cleanup
    return () => {
      connectionTester.onload = null;
      connectionTester.onerror = null;
      connectionTester.src = ""; // Cancel request
      clearTimeout(safetyTimer);
    };
  }, [isActive]);

  return { videoRef: cameraRef, stream, error, isLoading };
}