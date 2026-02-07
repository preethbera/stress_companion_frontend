import React, { useRef, useState, useEffect } from "react";
import { Loader2, AlertCircle, WifiOff, Camera } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming you have a cn utility, if not, standard strings work too

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
  // This allows the component to "retry" automatically if the backend comes back online
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

  // 2. Handle Image Loading Failures (The "Weird Image" Fix)
  const handleImgError = () => {
    setImgLoadError(true);
  };

  if (!isActive) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-900 text-neutral-500">
        <Camera className="h-12 w-12 mb-2 opacity-20" />
        <p className="text-sm">Thermal Camera Inactive</p>
      </div>
    );
  }

  // Combine parent-provided errors with local image loading errors
  const activeError = error || (imgLoadError ? "Connection refused" : null);

  if (activeError) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-neutral-900 text-red-400 p-6 text-center border border-neutral-800 rounded-md">
        <div className="bg-red-500/10 p-4 rounded-full mb-3">
            <WifiOff className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Thermal Feed Offline</h3>
        <p className="text-sm text-neutral-400 max-w-[200px] leading-relaxed">
          {imgLoadError ? "Cannot connect to the camera stream." : activeError}
        </p>
        <p className="text-[10px] uppercase tracking-wider text-neutral-600 mt-4 font-mono">
           Status: Disconnected
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center rounded-md border border-neutral-800">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-orange-500" />
          <p className="text-sm font-medium">Initializing Thermal Sensor...</p>
        </div>
      )}

      <div className="relative w-full h-full transform scale-x-[-1]">
        {/* Only render the IMG tag if we have a stream AND no error.
           This prevents the "broken image icon" from ever appearing.
        */}
        {stream && !imgLoadError && (
          <img 
            ref={localImgRef} 
            src={stream}
            alt="Thermal Feed"
            crossOrigin="anonymous"
            onLoad={handleImgLoad}
            onError={handleImgError} // <--- This catches the broken image!
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