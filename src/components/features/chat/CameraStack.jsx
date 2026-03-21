import React from "react";
import { Video, Thermometer } from "lucide-react";
import { CameraPanel } from "@/components/features/chat/CameraPanel";
import { useUIStore } from "@/store/useUIStore";

export const CameraStack = () => {
  const isOpticalVisible = useUIStore((state) => state.isOpticalVisible);
  const isThermalVisible = useUIStore((state) => state.isThermalVisible);

  return (
    <div className="flex flex-col h-full w-full bg-background border-border overflow-hidden">
      {isOpticalVisible && (
        <CameraPanel
          title="Optical Feed"
          icon={Video}
          iconColorClass="text-blue-500"
          cameraId="optical"
        />
      )}
      {isThermalVisible && (
        <CameraPanel
          title="Thermal Feed"
          icon={Thermometer}
          iconColorClass="text-orange-500"
          cameraId="thermal"
        />
      )}
    </div>
  );
};
