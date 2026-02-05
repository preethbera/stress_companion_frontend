import React from "react";
import { Loader2, AlertCircle, WifiOff, Wifi } from "lucide-react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceDetection } from "@/hooks/useFaceDetection";
import { useFaceTracker } from "@/hooks/useFaceTracker";
import { useStressSocket } from "@/hooks/useStressSocket";

export function CameraFeed({ isActive = true }) {
  // 1. Networking
  const { sendFrame, isConnected } = useStressSocket(isActive);

  // 2. Hardware & AI
  const { videoRef, error: cameraError, isLoading: isCameraLoading } = useCamera({ isActive });
  const { detectorRef, isModelLoaded, modelError } = useFaceDetection();

  // 3. Logic (Tracker -> sends blob to socket)
  const { overlayRef, cropCanvasRef } = useFaceTracker(
    videoRef, 
    detectorRef.current,
    isActive && isModelLoaded && !isCameraLoading,
    sendFrame // <--- Direct connection
  );

  const isLoading = isActive && (!isModelLoaded || isCameraLoading);
  const error = cameraError || modelError;

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

      {/* Connection Status Indicators */}
      {!isLoading && (
        <div className="absolute top-2 right-2 z-30 px-2 py-1 rounded text-[10px] flex items-center gap-1 font-medium bg-black/50 backdrop-blur-sm">
           {isConnected ? (
             <span className="text-green-400 flex items-center gap-1"><Wifi className="h-3 w-3" /> Live</span>
           ) : (
             <span className="text-red-400 flex items-center gap-1"><WifiOff className="h-3 w-3" /> Offline</span>
           )}
        </div>
      )}

      <div className="relative w-full h-full transform scale-x-[-1]">
        <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-contain" />
        <canvas ref={overlayRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
      </div>

      <canvas ref={cropCanvasRef} className="hidden" />
    </div>
  );
}