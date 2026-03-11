import React, { useRef, useEffect, useState } from "react";
import { Loader2, Camera, CameraOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function CameraFeed({ 
  isActive = true,
  isLoading = false,
  error = null,
  stream, 
  overlayRef, 
  title = "Camera" 
}) {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // 1. Attach Stream
  useEffect(() => {
    setIsVideoReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = stream || null;
    }
  }, [stream]);

  // 2. Sync Canvas perfectly with Video dimensions
  const syncCanvas = () => {
    if (!videoRef.current || !overlayRef?.current) return;
    const video = videoRef.current;
    const canvas = overlayRef.current;
    
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setIsVideoReady(true);
    }
  };

  // --- UI STATES ---

  // State A: User opted out
  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-card rounded-xl border border-dashed border-border text-muted-foreground p-6">
        <CameraOff className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-medium text-sm">{title} Not Used</p>
      </div>
    );
  }

  // State B: Camera crashed or failed to load
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-card border border-border p-6 text-center">
        <div className="bg-destructive/10 p-4 rounded-full mb-3">
          <CameraOff className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Feed Error</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
      </div>
    );
  }

  // State C: Active Video Stream
  return (
    <div className="relative w-full h-full overflow-hidden flex items-center justify-center bg-black border border-border">
      
      {/* Loading Spinner until the first frame paints */}
      {(isLoading || !isVideoReady) && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Starting {title}...</p>
        </div>
      )}

      {/* The actual mirrored video and synced canvas */}
      <div className="relative w-full h-full -scale-x-100">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          onLoadedMetadata={syncCanvas}
          onResize={syncCanvas}
          onPlaying={() => setIsVideoReady(true)}
          className="absolute inset-0 w-full h-full object-contain" 
        />
        <canvas 
          ref={overlayRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      </div>
    </div>
  );
}