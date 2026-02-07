import { useState, useEffect, useRef } from "react";

export function useOpticalCamera({ isActive = true } = {}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const stopStream = () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };

    const startCamera = async () => {
      if (!isActive) {
        stopStream();
        setStream(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera Error:", err);
        if (isMounted) setError("Could not access camera. Check permissions.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopStream();
    };
    // stream dependency removed to prevent loop, only re-run on isActive change
  }, [isActive]);

  return { videoRef, stream, error, isLoading };
}