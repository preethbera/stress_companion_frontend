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
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        // 2. Hardware Disconnect Listener
        // If the user unplugs the camera, this event fires.
        const videoTrack = mediaStream.getVideoTracks()[0];
        videoTrack.onended = () => {
          if (isMounted) {
            console.warn("Optical Camera Disconnected (Hardware level)");
            setError("Camera disconnected unexpectedly.");
            setStream(null); // This triggers the Socket to Close
          }
        };

        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Optical Camera Error:", err);
        if (isMounted) {
          // 3. Gatekeeper Logic:
          // If error, Stream MUST be null and Loading MUST be false.
          setError("Camera access denied or unavailable.");
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