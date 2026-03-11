import React from "react";
import { BaseCameraStep } from "./SharedComponents";

export function OpticalStep(props) {
  return (
    <BaseCameraStep
      {...props}
      stepName="Optical"
      title="Optical Position"
      description="Position yourself so your face is aligned within the oval overlay. This allows the system to monitor physiological markers."
      defaultNextLabel="Continue"
      deviceKey="opticalDeviceId"
      optOutKey="optOutOptical"
      otherDeviceKey="thermalDeviceId"
      otherOptOutKey="optOutThermal"
    />
  );
}