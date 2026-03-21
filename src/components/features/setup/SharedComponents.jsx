import React from "react";
import { Button } from "@/components/ui/button";
import { CameraOff, Loader2, Camera } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { AspectRatio } from "@/components/ui/aspect-ratio";

import { cn } from "@/lib/utils";

export function StepLayout({ children }) {
  return (
    <div className="flex flex-col items-center gap-5 transition-all duration-300 pb-8">
      {children}
    </div>
  );
}

export function StepHeader({ title, description, align = "center" }) {
  return (
    <div
      className={`space-y-2 ${align === "center" ? "text-center" : "text-left"}`}
    >
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

export function StepFooter({
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
  showBack = true,
}) {
  return (
    <div className="pt-4 border-t border-border/50 flex justify-between items-center w-full min-w-2xl">
      {showBack ? (
        <Button variant="outline" size="lg" onClick={onBack} className="px-8">
          Back
        </Button>
      ) : (
        <div />
      )}
      <Button
        size="lg"
        onClick={onNext}
        disabled={nextDisabled}
        className="px-8 min-w-32"
      >
        {nextLabel}
      </Button>
    </div>
  );
}

// ============================================================================
// CAMERA PREVIEW COMPONENT
// Pure presentation component. Requires no state management knowledge.
// ============================================================================
export function CameraPreview({
  videoRef,
  hasFace = false,
  fallbackLabel = null,
  aspectRatio = 16 / 9,
}) {
  return (
    <AspectRatio
      ratio={aspectRatio}
      className="w-full max-w-2xl mx-auto overflow-hidden rounded-3xl border-2 border-dashed bg-muted shadow-xl"
    >
      {fallbackLabel ? (
        // Fallback state
        <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground opacity-50">
          <CameraOff className="mb-4 h-16 w-16" />
          <p className="font-medium">{fallbackLabel}</p>
        </div>
      ) : (
        // Active video state
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full scale-x-[-1] object-cover"
          />

          {/* Face Detection Overlay Container */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <div
              className={cn(
                "aspect-[3/4] w-[45%] max-w-[260px] rounded-full border-2 transition-colors duration-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]",
                hasFace ? "border-green-500" : "border-white/40 border-dashed",
              )}
            />
          </div>
        </>
      )}
    </AspectRatio>
  );
}
// ============================================================================
// BASE CAMERA STEP COMPONENT
// ============================================================================

export function BaseCameraStep({
  stepName,

  //top text
  title,
  description,

  alert = null,

  badgeStatus = null, // "preparing", "found", "missing"

  // switch for opting out
  isOptedOut = false,
  onOptOutToggle,

  // select
  selectedDeviceId = "",
  onDeviceSelect,
  // The UI now expects a simple, pre-computed array: [{ id: "123", label: "Front Cam", disabled: false }]
  availableCameras = [],

  // for video
  videoRef,
  fallbackLabel = null,
  aspectRatio = "16/9",

  // footer buttons
  nextLabel,
  isNextDisabled,
  onNext,
  onBack,
}) {
  const badgeConfig = {
    preparing: {
      label: "Preparing system...", // Covers permissions, model loading, etc.
      variant: "outline",
      className: "bg-transparent text-gray-300 border-gray-300",
      icon: <Loader2 className="w-4 h-4 mr-2 animate-spin text-gray-300" />,
    },
    found: {
      label: "Face detected",
      variant: "default",
      className: "bg-transparent text-green-300 border-green-300",
      icon: <CheckCircle2 className="w-4 h-4 mr-2 text-green-300" />,
    },
    missing: {
      label: "Center your face",
      variant: "secondary",
      className: "bg-transparent text-amber-300 border-amber-300",
      icon: <AlertCircle className="w-4 h-4 mr-2 text-amber-300" />,
    },
  };

  const currentBadgeConfig = badgeConfig[badgeStatus];

  return (
    <StepLayout>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:gap-5 items-top">
        <div className="flex flex-col gap-5">
          <StepHeader align="left" title={title} description={description} />

          <div className="bg-secondary/20 p-4 flex flex-col gap-6 rounded-xl border border-border/50">
            {alert && (
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertTitle> {alert.title} </AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-3">
              <Switch
                id={`opt-out-${stepName}`}
                checked={isOptedOut}
                onCheckedChange={onOptOutToggle}
              />
              <Label
                htmlFor={`opt-out-${stepName}`}
                className="text-sm font-medium cursor-pointer"
              >
                Proceed without {stepName} Camera
              </Label>
            </div>

            {!isOptedOut && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Device
                </Label>
                <Select value={selectedDeviceId} onValueChange={onDeviceSelect}>
                  <SelectTrigger className="w-full border-border bg-background">
                    <SelectValue placeholder="Select Camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCameras.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No cameras available
                      </SelectItem>
                    ) : (
                      availableCameras.map((cam) => (
                        <SelectItem
                          key={cam.id}
                          value={cam.id}
                          disabled={cam.disabled}
                        >
                          {cam.label}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {badgeStatus && (
            <Badge
              variant={currentBadgeConfig.variant}
              className={`flex items-center px-3 py-1 ${currentBadgeConfig.className}`}
            >
              {currentBadgeConfig.icon}
              {currentBadgeConfig.label}
            </Badge>
          )}
        </div>

        <CameraPreview
          videoRef={videoRef}
          hasFace={badgeStatus === "found"}
          fallbackLabel={fallbackLabel}
          aspectRatio={aspectRatio}
        />
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        nextDisabled={isNextDisabled}
        nextLabel={nextLabel}
      />
    </StepLayout>
  );
}
