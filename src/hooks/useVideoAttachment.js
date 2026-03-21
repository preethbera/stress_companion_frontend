import { useEffect, useRef } from 'react';
import { MediaRegistry } from '@/core/vision/MediaRegistry'; 

export function useVideoAttachment(cameraId, isActive = true, refreshTrigger = null) {
  // This ref will now be attached directly to a <video> tag in your JSX, not a <div> container
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !isActive) return;

    // Borrow the raw STREAM data, NOT the AI's private video element.
    const stream = MediaRegistry.getStream(cameraId);

    if (stream) {
      // Feed the stream into the UI's video window
      videoElement.srcObject = stream;
      
      // Force it to play so it doesn't stay frozen when attached
      videoElement.play().catch(err => {
        console.warn(`useVideoAttachment [${cameraId}]: Play failed on attach`, err);
      });
    }

    // CLEANUP: When the user closes the panel, just clear the source of this specific UI window.
    // The browser will NOT pause the AI's hidden video element, keeping the pipeline perfectly alive.
    return () => {
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [cameraId, isActive, refreshTrigger]); 

  return videoRef;
}