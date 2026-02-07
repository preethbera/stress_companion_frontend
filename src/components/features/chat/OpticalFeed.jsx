import React, { useRef, useEffect } from "react";
import { Loader2, AlertCircle, WifiOff, Wifi } from "lucide-react";

export function OpticalFeed({ 
  // State Props
  isActive = true,
  isLoading = false,
  error = null,
  
  // Ref Props
  stream, 
  overlayRef, // <--- If this is undefined, the app will crash without the fix below
}) {
  const localVideoRef = useRef(null);

  // 1. Attach Stream to the visible video element
  useEffect(() => {
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  // 2. Sync Canvas Dimensions (CRITICAL FOR GREEN BOX)
  const handleVideoLoad = () => {
    // SAFETY CHECK: Ensure refs exist before accessing .current
    if (!localVideoRef.current || !overlayRef) return;

    const video = localVideoRef.current;
    const canvas = overlayRef.current;
    
    if (video && canvas) {
      // Set the canvas internal resolution to match the video stream
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  };

  if (!isActive) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black/50 text-destructive p-4 text-center">
        <AlertCircle className="h-6 w-6 mb-2" />
        <p className="text-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
      
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p className="text-xs text-muted-foreground">Initializing System...</p>
        </div>
      )}

      <div className="relative w-full h-full transform scale-x-[-1]">
        <video 
          ref={localVideoRef} 
          autoPlay 
          playsInline 
          muted 
          onLoadedMetadata={handleVideoLoad} 
          className="absolute inset-0 w-full h-full object-contain" 
        />
        
        {/* Pass ref only if it exists */}
        <canvas 
          ref={overlayRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      </div>
    </div>
  );
}