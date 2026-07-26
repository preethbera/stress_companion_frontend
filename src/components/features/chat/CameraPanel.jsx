import React from "react";
import { X, WifiOff, Circle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CameraFeed } from "./CameraFeed";

import { useUIStore } from "@/store/useUIStore";
import { useVisionStore } from "@/store/useVisionStore";

export function CameraPanel({
  title,
  icon: Icon,
  iconColorClass,
  cameraId,
}) {
  const connectionStatus = useVisionStore((state) => state[cameraId].connectionStatus);
  const toggleOptical = useUIStore((state) => state.toggleOptical);
  const toggleThermal = useUIStore((state) => state.toggleThermal);

  const handleClose = () => {
    if (cameraId === "optical") toggleOptical();
    if (cameraId === "thermal") toggleThermal();
  };

  const badgeConfig = {
    connected: {
      label: "Live",
      variant: "outline",
      icon: <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500 dark:fill-emerald-400 dark:text-emerald-400" />,
      className: "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
    },
    connecting: {
      label: "Connecting...",
      variant: "secondary",
      icon: <Spinner className="h-3 w-3 text-muted-foreground" />,
      className: "bg-secondary text-secondary-foreground",
    },
    disconnected: {
      label: "Offline",
      variant: "destructive",
      icon: <WifiOff className="h-3 w-3" />,
      className: "", 
    },
  };

  const currentStatus = badgeConfig[connectionStatus] || badgeConfig["disconnected"];

  return (
    <div className="relative flex flex-col flex-1 min-h-0 bg-background transition-all border-b border-border">
      <div className="flex items-center justify-between px-3 h-12 border-b border-border bg-card/50 select-none">
        <div className="flex items-center gap-2.5">
          <Icon className={cn("h-4 w-4", iconColorClass)} />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={currentStatus.variant}
            className={cn("flex items-center gap-1.5 w-fit px-2.5 py-0.5", currentStatus.className)}
          >
            {currentStatus.icon}
            <span className="font-medium">{currentStatus.label}</span>
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <CameraFeed cameraId={cameraId} />
    </div>
  );
}