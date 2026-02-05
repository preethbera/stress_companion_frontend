import { useState, useEffect, useRef } from "react";

export function useCamera({ isActive = true } = {}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Cleanup function to stop tracks
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
            width: { ideal: 640 }, // Standard resolution is enough for face detection
            height: { ideal: 480 },
          },
          audio: false,
        });

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Wait for metadata to ensure video dimensions are ready
          await new Promise((resolve) => {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          });
        }
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Could not access camera. Please check permissions.");
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => stopStream();
  }, [isActive]);

  return { videoRef, stream, error, isLoading };
}