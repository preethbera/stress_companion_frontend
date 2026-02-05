import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

export function CameraFeed({ 
  isActive, 
  onFrame,          // Callback to send frame to backend
  captureInterval = 1000 // How often to send frame (ms)
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Start/Stop Camera Stream
  useEffect(() => {
    let stream = null;

    const startCamera = async () => {
      if (!isActive) return;

      try {
        setIsLoading(true);
        // Request video
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          }, 
          audio: false 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsLoading(false);
      } catch (err) {
        console.error("Camera Error:", err);
        setError("Camera access denied or unavailable.");
        setIsLoading(false);
      }
    };

    if (isActive) {
      startCamera();
    } else {
      // Cleanup if component stays mounted but inactive
      if (videoRef.current?.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive]);

  // 2. Capture Frames for Backend
  useEffect(() => {
    if (!isActive || !onFrame) return;

    const intervalId = setInterval(() => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");

        // Ensure video is playing and has dimensions
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          // Match canvas size to video size
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw current video frame to canvas
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to Base64 (or Blob) to send to backend
          const imageData = canvas.toDataURL("image/jpeg", 0.7); // 0.7 quality
          onFrame(imageData);
        }
      }
    }, captureInterval);

    return () => clearInterval(intervalId);
  }, [isActive, onFrame, captureInterval]);

  // --- RENDER ---
  if (!isActive) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-destructive p-4 text-center">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
      
      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {/* The Live Video Feed */}
      {/* transform scale-x-[-1] mirrors the video like a selfie cam */}
      <video 
        ref={videoRef}
        autoPlay 
        playsInline 
        muted 
        className="h-full w-full object-cover transform scale-x-[-1]"
      />

      {/* Hidden Canvas for processing (Invisible to user) */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay Layer (For Face Detection Boxes later) */}
      {/* You can pass processed data back here to draw boxes */}
      <div className="absolute inset-0 pointer-events-none">
         {/* <BoundingBoxOverlay /> */}
      </div>
    </div>
  );
}