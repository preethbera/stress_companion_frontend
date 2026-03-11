import React from "react";
import { Button } from "@/components/ui/button";
import { CameraOff, Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { useCameraStepLogic } from "@/hooks/useSetupLogic";

export function StepLayout({ children }) {
  return <div className="flex flex-col w-full space-y-8 pb-8">{children}</div>;
}

export function StepHeader({ title, description, align = "center" }) {
  return (
    <div className={`space-y-2 mb-8 ${align === "center" ? "text-center" : "text-left"}`}>
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function StepFooter({ onBack, onNext, nextLabel = "Continue", nextDisabled = false, showBack = true }) {
  return (
    <div className="pt-4 border-t border-border/50 flex justify-between items-center w-full">
      {showBack ? (
        <Button variant="outline" size="lg" onClick={onBack} className="px-8">Back</Button>
      ) : <div />}
      <Button size="lg" onClick={onNext} disabled={nextDisabled} className="px-8 min-w-32">
        {nextLabel}
      </Button>
    </div>
  );
}

export function CameraPreview({ videoRef, isOptedOut, isLive, isLoaded, hasFace = false, label = "Camera Disabled" }) {
  return (
    <div className="relative aspect-video w-full max-w-2xl mx-auto bg-muted rounded-3xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden shadow-xl">
      {isOptedOut ? (
        <div className="flex flex-col items-center text-muted-foreground opacity-50">
          <CameraOff className="h-16 w-16 mb-4" />
          <p className="font-medium">{label}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={(e) => e.target.play().catch(() => {})}
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
          />
          
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
             <div className={`w-[45%] max-w-[260px] aspect-[3/4] border-1 rounded-full transition-all duration-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] ${
                hasFace ? "border-green-500" : "border-white/40 border-dashed"
             }`} />
          </div>

          {!isLoaded && isLive && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </>
      )}
    </div>
  );
}



export function BaseCameraStep({
  title,
  description,
  stepName,
  defaultNextLabel,
  setupData,
  updateSetupData,
  onNext,
  onBack,
  deviceKey,
  optOutKey,
  otherDeviceKey,
  otherOptOutKey,
}) {
  const {
    videoInputs, videoRef, isCameraLive, hasFace, isModelLoaded,
    isOptOut, deviceId, otherCameraName, isBlocked,
    handleNextClick, handleOptOutToggle, isNextDisabled,
    showPlaceholder, previewLabel, otherStepName
  } = useCameraStepLogic({
    setupData, updateSetupData, onNext, deviceKey, optOutKey, otherDeviceKey, otherOptOutKey, stepName
  });

  let nextLabel = defaultNextLabel;
  if (isOptOut) nextLabel = "Skip Camera";
  if (isBlocked) nextLabel = `Skip ${stepName} Setup`;

  return (
    <StepLayout>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col space-y-8">
          <StepHeader align="left" title={title} description={description} />

          <div className="bg-secondary/20 p-6 rounded-xl border border-border/50 space-y-6">
            
            {isBlocked && (
              <div className="p-4 rounded-lg bg-background border border-border text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">{otherCameraName}</span> is already in use by the {otherStepName} feed.
                </p>
                <p className="mt-1">
                  Click <strong>"{nextLabel}"</strong> below to bypass this step.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Switch id={`opt-out-${stepName.toLowerCase()}`} checked={isOptOut} onCheckedChange={handleOptOutToggle} />
              <Label htmlFor={`opt-out-${stepName.toLowerCase()}`} className="text-sm font-medium cursor-pointer">
                Proceed without {stepName} Camera
              </Label>
            </div>

            {!isOptOut && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Device</Label>
                <Select value={deviceId || ""} onValueChange={(val) => updateSetupData(deviceKey, val)}>
                  <SelectTrigger className="w-full bg-background border-border">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoInputs.length === 0 && <SelectItem value="none" disabled>No cameras found</SelectItem>}
                    {videoInputs.map((cam) => {
                      const isInUseByOther = cam.deviceId === setupData[otherDeviceKey] && !setupData[otherOptOutKey];
                      return (
                        <SelectItem key={cam.deviceId} value={cam.deviceId} disabled={isInUseByOther}>
                          {cam.label} {isInUseByOther ? `(In use by ${otherStepName})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {!showPlaceholder && (
            <div className="flex items-center space-x-2 text-sm">
              {hasFace ? (
                <span className="flex items-center text-green-500 font-semibold px-3 py-1 bg-green-500/10 rounded-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Face detected
                </span>
              ) : (
                <span className="flex items-center text-amber-500 font-semibold px-3 py-1 bg-amber-500/10 rounded-full">
                  <AlertCircle className="w-4 h-4 mr-2" /> Center your face
                </span>
              )}
            </div>
          )}
        </div>

        <CameraPreview 
          videoRef={videoRef} 
          isOptedOut={showPlaceholder} 
          isLive={isCameraLive} 
          isLoaded={isModelLoaded} 
          hasFace={hasFace} 
          label={previewLabel} 
        />
      </div>

      <StepFooter 
        onBack={onBack} 
        onNext={handleNextClick} 
        nextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </StepLayout>
  );
}