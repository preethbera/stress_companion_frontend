import React from "react";
import { BaseCameraStep } from "./SharedComponents";
import { useCameraSetupStep } from "@/hooks/setup/useCameraSetupStep";

export function OpticalStep({ onNext, onBack }) {
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
  } = useCameraSetupStep("optical");

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
      description: `${cleanBlockingName} is already in use by the Thermal feed. Click below to bypass this step.`
    };
  }

  let fallbackLabel = null;
  if (isOptedOut) fallbackLabel = "Optical Camera Skipped";
  else if (availableCameras.length === 0) fallbackLabel = "No Camera Found";
  else if (isBlocked) fallbackLabel = "Camera in use by Thermal";

  const formattedCameras = availableCameras.map(cam => {
    const cleanLabel = cam.label.replace(/\s*\([^)]*\)$/, '');
    return {
      ...cam,
      label: cam.disabled ? `${cleanLabel} (In use by Thermal)` : cleanLabel
    };
  });

  const isNextDisabled = !isOptedOut && !isBlocked && (!hasFace || !isModelLoaded);
  const nextLabel = isOptedOut || isBlocked ? "Skip Optical Setup" : "Continue";

  return (
    <BaseCameraStep
      stepName="Optical"
      title="Optical Position"
      description="Position yourself so your face is aligned within the oval overlay. This allows the system to monitor physiological markers."
      
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