import React, { useRef, useEffect, useState } from "react";
import { Loader2, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpticalFeed({ 
  // State Props
  isActive = true,
  isLoading = false,
  error = null,
  
  // Ref Props
  stream, 
  overlayRef, 
}) {
  const localVideoRef = useRef(null);
  
  // Local state to track video element specific failures
  const [videoError, setVideoError] = useState(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // 1. Attach Stream to the visible video element
  useEffect(() => {
    // Reset local states when stream changes
    setVideoError(null);
    setIsVideoReady(false);

    const videoEl = localVideoRef.current;
    if (!videoEl) return;

    if (stream) {
      videoEl.srcObject = stream;
    } else {
      videoEl.srcObject = null;
    }
  }, [stream]);

  // 2. Sync Canvas Dimensions (CRITICAL FOR GREEN BOX)
  // We call this when metadata loads AND when the video actually starts playing
  const syncCanvas = () => {
    if (!localVideoRef.current || !overlayRef?.current) return;

    const video = localVideoRef.current;
    const canvas = overlayRef.current;
    
    // Ensure we have valid dimensions
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setIsVideoReady(true);
    }
  };

  // 3. Handle Internal Video Errors
  const handleVideoError = (e) => {
    console.error("Video Element Error:", e);
    setVideoError("Video stream failed to render.");
  };

  // 4. Inactive State
  if (!isActive) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full w-full border",
        "bg-muted border-border text-muted-foreground" // Replaced hardcoded neutral-900/500
      )}>
        <Camera className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-sm font-medium">Camera Inactive</p>
      </div>
    );
  }

  // 5. Consolidated Error State (Parent Prop OR Local Video Error)
  const activeError = error || videoError;

  if (activeError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full w-full p-6 text-center",
        "bg-card", // Replaced bg-neutral-900
      )}>
        <div className="bg-destructive/10 p-4 rounded-full mb-3">
          <CameraOff className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Camera Error</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {activeError}
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className={cn(
            "mt-4 text-xs px-4 py-2 rounded transition-colors",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80" // Replaced neutral-800/300 logic
          )}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden flex items-center justify-center border",
      "bg-black border-border" // Kept bg-black for video context
    )}>
      
      {/* Loading Overlay: Shows if parent says loading OR if video isn't ready yet */}
      {(isLoading || (!isVideoReady && !activeError)) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 text-foreground backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Starting Optical Sensor...</p>
        </div>
      )}

      <div className="relative w-full h-full -scale-x-100">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          // Event Handlers for Robustness
          onLoadedMetadata={syncCanvas}
          onResize={syncCanvas} // Handle dynamic resolution changes
          onPlaying={() => setIsVideoReady(true)} // Remove loader only when actually playing
          onError={handleVideoError}
          className="absolute inset-0 w-full h-full object-contain" 
        />
        
        {/* Face Tracking Overlay */}
        <canvas 
          ref={overlayRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      </div>
    </div>
  );
}