import React from "react";
import { X, Video, Thermometer, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * CAMERA STACK COMPONENT
 * * Logic:
 * - Uses Flexbox (flex-col) to stack items vertically.
 * - 'flex-1' ensures items expand to fill available space.
 * - If one camera closes, the other automatically grows to 100% height.
 */
const CameraStack = ({ 
  isNormalOpen, 
  isThermalOpen, 
  onCloseNormal, 
  onCloseThermal,
  // Slot props allow us to inject the real camera feeds later
  normalFeedSlot, 
  thermalFeedSlot 
}) => {

  // If both are closed, we render nothing (parent should likely collapse the panel)
  if (!isNormalOpen && !isThermalOpen) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background border-r">
      
      {/* --- NORMAL CAMERA SECTION --- */}
      {isNormalOpen && (
        <div className={cn(
          "relative flex flex-col min-h-0 border-b border-border transition-all duration-300",
          // If thermal is closed, Normal takes full height (flex-1). 
          // If thermal is open, they share space (flex-1 for both).
          "flex-1" 
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 h-12 bg-muted/30 border-b">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Video className="h-4 w-4 text-blue-500" />
              <span>Normal Feed</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              onClick={onCloseNormal}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Normal Camera</span>
            </Button>
          </div>

          {/* Content Area (Video Feed) */}
          <div className="flex-1 bg-black relative overflow-hidden">
             {/* The 'slot' pattern allows us to pass the real <video> logic 
               from the parent, keeping this layout component dumb and clean.
             */}
             {normalFeedSlot ? normalFeedSlot : (
               <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <span className="text-xs">No Signal</span>
               </div>
             )}
          </div>
        </div>
      )}

      {/* --- THERMAL CAMERA SECTION --- */}
      {isThermalOpen && (
        <div className="flex-1 relative flex flex-col min-h-0 transition-all duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-3 h-12 bg-muted/30 border-b border-t-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Thermometer className="h-4 w-4 text-orange-500" />
              <span>Thermal Feed</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
              onClick={onCloseThermal}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close Thermal Camera</span>
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-muted/10 relative flex items-center justify-center">
            {thermalFeedSlot ? thermalFeedSlot : (
               <div className="flex flex-col items-center justify-center text-muted-foreground opacity-50 p-4 text-center">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <p className="text-xs">Thermal sensor not detected</p>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { CameraStack };