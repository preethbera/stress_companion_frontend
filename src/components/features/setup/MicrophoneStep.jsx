import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, CheckCircle2 } from "lucide-react";
import { useMicrophoneStep } from "@/hooks/setup/useMicrophoneStep"; 
import { useSessionStore } from "@/store/useSessionStore";
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";
import { cn } from "@/lib/utils";

export function MicrophoneStep({ onNext, onBack }) {
  const micDeviceId = useSessionStore((state) => state.hardwareConfig.micDeviceId);
  const setHardwareConfig = useSessionStore((state) => state.setHardwareConfig);

  const { audioInputs, volume, hasSpoken } = useMicrophoneStep();

  const getBarHeight = (baseHeight, volumeFactor) => {
    const scaledVolume = (volume / 255) * volumeFactor;
    return `${Math.min(100, baseHeight + scaledVolume)}%`;
  };

  const barFactors = [15, 30, 60, 90, 110, 90, 60, 30, 15];

  return (
    <StepLayout>
      <StepHeader 
        title="Microphone Check" 
        description={hasSpoken ? "Audio levels look great. You can proceed." : "Say something like \"Hello, I am ready to begin.\""} 
      />

      <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full max-w-md mx-auto">
        <div className="flex flex-col items-center justify-center p-4 bg-secondary/30 rounded-xl border border-dashed border-border w-full">
          <div className="flex items-center justify-between space-x-4 w-full">
            <div 
              className={cn(
                "flex items-center justify-center p-3 rounded-full border transition-colors duration-500 shrink-0",
                hasSpoken 
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30" 
                  : "bg-background text-muted-foreground border-border"
              )}
            >
              <Mic className="h-6 w-6" />
            </div>

            <div className="flex-1 flex items-center justify-center h-16 space-x-1.5 px-2">
              {barFactors.map((factor, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "w-1.5 rounded-full transition-all duration-75 ease-out",
                    hasSpoken ? "bg-emerald-500/60 dark:bg-emerald-400/60" : "bg-primary/80"
                  )} 
                  style={{ 
                    height: getBarHeight(10, factor), 
                    opacity: volume > 5 ? 1 : 0.4 
                  }} 
                />
              ))}
            </div>

            <div className="w-24 h-8 flex items-center justify-end shrink-0">
              {hasSpoken ? (
                <span className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Detected
                </span>
              ) : (
                <span className="text-xs text-muted-foreground font-medium">Listening...</span>
              )}
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
           <Select value={micDeviceId || ""} onValueChange={(val) => setHardwareConfig({ micDeviceId: val })}>
            <SelectTrigger className="w-full border-border bg-background text-foreground">
              <SelectValue placeholder="Select Microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioInputs.length === 0 ? (
                <SelectItem value="none" disabled>No microphones found</SelectItem>
              ) : (
                audioInputs.map((mic) => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || `Microphone ${mic.deviceId.substring(0, 5)}...`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StepFooter 
        onBack={onBack} 
        onNext={onNext} 
        nextDisabled={!micDeviceId}
        nextLabel={hasSpoken ? "Audio Sounds Good" : "Skip Audio Check"}
      />
    </StepLayout>
  );
}