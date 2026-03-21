import React from "react";
import { CameraOff } from "lucide-react";
import { useVideoAttachment } from "@/hooks/useVideoAttachment";
import { useVisionStore } from "@/store/useVisionStore";
import { useSessionStore } from "@/store/useSessionStore";
import { cn } from "@/lib/utils";

export function CameraFeed({ cameraId, isMirrored = true }) {
  const videoContainerRef = useVideoAttachment(cameraId);

  const isOptedOut = useSessionStore((state) =>
    cameraId === "optical"
      ? state.hardwareConfig.optOutOptical
      : state.hardwareConfig.optOutThermal,
  );

  const boundingBox = useVisionStore((state) => state[cameraId].boundingBox);
  const aspectRatio = useVisionStore((state) => state[cameraId].aspectRatio);
  const error = useVisionStore((state) => state[cameraId].error);

  // --- STATE A: User Opted Out ---
  if (isOptedOut) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-card text-muted-foreground p-6">
        <CameraOff className="h-10 w-10 mb-3 opacity-40" />
        <p className="font-medium text-sm capitalize">
          {cameraId} Camera Not Used
        </p>
      </div>
    );
  }

  // --- STATE B: Runtime Error (Disconnected, Permission Denied, etc.) ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-card p-6 text-center">
        <div className="p-4 mb-3">
          <CameraOff className="h-10 w-10 mb-3 opacity-40" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Camera Error</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div
        className="relative inline-flex max-w-full max-h-full"
        style={{ aspectRatio }}
      >
        <video
          ref={videoContainerRef}
          muted
          playsInline
          className={cn(
            "max-w-full max-h-full object-contain",
            isMirrored && "-scale-x-100",
          )}
          style={{ aspectRatio }}
        />
        {boundingBox && (
          <div
            className={cn(
              "absolute inset-0 z-10 pointer-events-none",
              isMirrored && "-scale-x-100",
            )}
          >
            <div
              className="absolute border-2 border-green-500 rounded-sm transition-all duration-100 ease-linear"
              style={{
                left: `${boundingBox.x}%`,
                top: `${boundingBox.y}%`,
                width: `${boundingBox.width}%`,
                height: `${boundingBox.height}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
