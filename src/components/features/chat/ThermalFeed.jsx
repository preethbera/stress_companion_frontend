import React, { useRef, useState, useEffect } from "react";
import { Loader2, AlertCircle, WifiOff, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThermalFeed({ 
  // State Props
  isActive = true,
  isLoading = false,
  error = null,
  
  // Ref Props
  stream,   
  overlayRef, 
}) {
  const localImgRef = useRef(null);
  
  // Local state to track if the specific image URL failed to load
  const [imgLoadError, setImgLoadError] = useState(false);

  // Reset the local error state whenever the stream URL changes
  useEffect(() => {
    if (stream) {
      setImgLoadError(false);
    }
  }, [stream]);

  // 1. Sync Canvas Dimensions
  const handleImgLoad = () => {
    if (!localImgRef.current || !overlayRef?.current) return;

    const img = localImgRef.current;
    const canvas = overlayRef.current;
    
    if (img && canvas) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
  };

  // 2. Handle Image Loading Failures
  const handleImgError = () => {
    setImgLoadError(true);
  };

  if (!isActive) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full w-full",
        "bg-muted text-muted-foreground" // Replaced bg-neutral-900/text-neutral-500
      )}>
        <Camera className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-sm">Thermal Camera Inactive</p>
      </div>
    );
  }

  // Combine parent-provided errors with local image loading errors
  const activeError = error || (imgLoadError ? "Connection refused" : null);

  if (activeError) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center h-full w-full p-6 text-center border",
        "bg-card border-border", // Replaced bg-neutral-900/border-neutral-800
        "text-destructive"       // Replaced text-red-400
      )}>
        <div className="bg-destructive/10 p-4 rounded-full mb-3">
            <WifiOff className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Thermal Feed Offline</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          {imgLoadError ? "Cannot connect to the camera stream." : activeError}
        </p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-4 font-mono">
           Status: Disconnected
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden flex items-center justify-center border",
      "bg-black border-border" // Kept bg-black for video contrast, standardized border
    )}>
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 text-foreground backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
          <p className="text-sm font-medium">Initializing Thermal Sensor...</p>
        </div>
      )}

      <div className="relative w-full h-full -scale-x-100">
        {/* Only render the IMG tag if we have a stream AND no error. */}
        {stream && !imgLoadError && (
          <img 
            ref={localImgRef} 
            src={stream}
            alt="Thermal Feed"
            crossOrigin="anonymous"
            onLoad={handleImgLoad}
            onError={handleImgError} 
            className="absolute inset-0 w-full h-full object-contain" 
          />
        )}
        
        {/* Overlay Canvas for Face Box */}
        <canvas 
          ref={overlayRef} 
          className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
        />
      </div>
    </div>
  );
}