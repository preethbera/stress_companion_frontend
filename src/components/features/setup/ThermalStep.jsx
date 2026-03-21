import React from "react";
import { BaseCameraStep } from "./SharedComponents";
import { useCameraSetupStep } from "@/hooks/setup/useCameraSetupStep";

export function ThermalStep({ onNext, onBack }) {
  const {
    videoRef,
    availableCameras,
    selectedDeviceId,
    isOptedOut,
    isBlocked,
    isCameraLive,
    isModelLoaded,
    hasFace,
    aspectRatio,
    onOptOutToggle,
    onDeviceSelect,
    handleNextClick
  } = useCameraSetupStep("thermal");

  let badgeStatus = null;
  if (!isOptedOut && selectedDeviceId) {
    if (!isCameraLive || !isModelLoaded) badgeStatus = "preparing";
    else if (hasFace) badgeStatus = "found";
    else badgeStatus = "missing";
  }

  let alert = null;
  if (isBlocked && !isOptedOut) {
    const blockingCamName = availableCameras.find(c => c.disabled)?.label || "Your camera";
    const cleanBlockingName = blockingCamName.replace(/\s*\([^)]*\)$/, '');
    
    alert = {
      title: "Camera In Use",
      description: `${cleanBlockingName} is already in use by the Optical feed. Click below to bypass this step.`
    };
  }

  let fallbackLabel = null;
  if (isOptedOut) fallbackLabel = "Thermal Camera Skipped";
  else if (availableCameras.length === 0) fallbackLabel = "No Camera Found";
  else if (isBlocked) fallbackLabel = "Camera in use by Optical";

  const formattedCameras = availableCameras.map(cam => {
    const cleanLabel = cam.label.replace(/\s*\([^)]*\)$/, '');
    return {
      ...cam,
      label: cam.disabled ? `${cleanLabel} (In use by Optical)` : cleanLabel
    };
  });

  const isNextDisabled = !isOptedOut && !isBlocked && (!hasFace || !isModelLoaded);
  const nextLabel = isOptedOut || isBlocked ? "Skip Thermal Setup" : "Feed Looks Good";

  return (
    <BaseCameraStep
      stepName="Thermal"
      title="Thermal Position"
      description="Verify the thermal feed is active, unobstructed, and your face is aligned within the guide."
      
      alert={alert}
      badgeStatus={badgeStatus}
      
      isOptedOut={isOptedOut}
      onOptOutToggle={onOptOutToggle}
      
      selectedDeviceId={selectedDeviceId}
      onDeviceSelect={onDeviceSelect}
      availableCameras={formattedCameras}
      
      videoRef={videoRef}
      fallbackLabel={fallbackLabel}
      aspectRatio={aspectRatio}
      
      nextLabel={nextLabel}
      isNextDisabled={isNextDisabled}
      onNext={() => handleNextClick(onNext)}
      onBack={onBack}
    />
  );
}