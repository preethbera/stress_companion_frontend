import React from "react";
import {
  X,
  Video,
  Thermometer,
  AlertCircle,
  WifiOff,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// --- Sub-component: Status Badge ---
// Keeps the UI clean using standard borders/backgrounds, but uses semantic colors for status
const ConnectionBadge = ({ isConnected, isLoading }) => {
  if (isLoading) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-medium transition-colors shadow-sm",
        isConnected
          ? "bg-background border-border text-foreground" // Live: Clean, neutral look
          : "bg-destructive/10 border-destructive/20 text-destructive" // Offline: Warning look
      )}
    >
      {isConnected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Live</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      )}
    </div>
  );
};

// --- Sub-component: Camera Panel ---
const CameraPanel = ({
  title,
  icon: Icon,
  iconColorClass, // Added this back so you can pass specific colors
  isConnected,
  isLoading,
  onClose,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col flex-1 min-h-0 bg-background transition-all",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-12 border-b border-border bg-card/50 select-none">
        
        {/* Left: Title & Icon */}
        <div className="flex items-center gap-2.5">
          <div className={cn("flex items-center justify-center p-1.5 rounded-md bg-accent/50", iconColorClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-foreground">
            {title}
          </span>
        </div>

        {/* Right: Status & Actions */}
        <div className="flex items-center gap-2">
          <ConnectionBadge isConnected={isConnected} isLoading={isLoading} />
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close {title}</span>
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden bg-muted/10">
        {children}
      </div>
    </div>
  );
};

// --- Main Component ---
const CameraStack = ({
  isOpticalOpen,
  isThermalOpen,
  onCloseOptical,
  onCloseThermal,
  opticalFeedSlot,
  thermalFeedSlot,
  isOpticalFeedLoading = false,
  isOpticalFeedConnected = false,
  isThermalFeedLoading = false,
  isThermalFeedConnected = false,
}) => {
  
  if (!isOpticalOpen && !isThermalOpen) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background border-border overflow-hidden">
      
      {/* --- OPTICAL SECTION --- */}
      {isOpticalOpen && (
        <CameraPanel
          title="Optical Feed"
          icon={Video}
          iconColorClass="text-blue-500" // Restored specific color
          isConnected={isOpticalFeedConnected}
          isLoading={isOpticalFeedLoading}
          onClose={onCloseOptical}
          className={isThermalOpen ? "border-b border-border" : ""}
        >
          {opticalFeedSlot ? (
             opticalFeedSlot
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50">
              <span className="text-xs font-medium">No Optical Signal</span>
            </div>
          )}
        </CameraPanel>
      )}

      {/* --- THERMAL SECTION --- */}
      {isThermalOpen && (
        <CameraPanel
          title="Thermal Feed"
          icon={Thermometer}
          iconColorClass="text-orange-500" // Restored specific color
          isConnected={isThermalFeedConnected}
          isLoading={isThermalFeedLoading}
          onClose={onCloseThermal}
        >
          {thermalFeedSlot ? (
            thermalFeedSlot
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/50 p-4">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-xs font-medium">Thermal Sensor Disconnected</p>
            </div>
          )}
        </CameraPanel>
      )}
    </div>
  );
};

export { CameraStack };