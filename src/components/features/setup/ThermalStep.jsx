import React from "react";
import { BaseCameraStep } from "./SharedComponents";

export function ThermalStep(props) {
  return (
    <BaseCameraStep
      {...props}
      stepName="Thermal"
      title="Thermal Position"
      description="Verify the thermal feed is active, unobstructed, and your face is aligned within the guide."
      defaultNextLabel="Feed Looks Good"
      deviceKey="thermalDeviceId"
      optOutKey="optOutThermal"
      otherDeviceKey="opticalDeviceId"
      otherOptOutKey="optOutOptical"
    />
  );
}