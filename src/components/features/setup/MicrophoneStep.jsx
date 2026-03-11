import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, CheckCircle2 } from "lucide-react";
import { useMicrophoneSetup } from "@/hooks/useSetupLogic"; 
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";

export function MicrophoneStep({ setupData, updateSetupData, onNext, onBack }) {
  // Logic, state, and side effects are completely abstracted
  const { audioInputs, volume, hasSpoken } = useMicrophoneSetup(setupData, updateSetupData);

  // UI helpers remain in the view
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
        <div className="flex flex-col items-center justify-center p-2 bg-secondary/10 rounded-xl border border-dashed w-full">
          <div className="flex items-center justify-center space-x-2 w-full">
            <div className={`flex items-center justify-center p-3 rounded-full border transition-colors duration-500 ${hasSpoken ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-background text-muted-foreground border-border'}`}>
              <Mic className="h-6 w-6" />
            </div>

            <div className="flex-1 flex items-center justify-center h-20 space-x-1 px-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className={`w-1.5 rounded-full transition-all duration-75 ease-out ${hasSpoken ? 'bg-green-500/60' : 'bg-primary'}`} style={{ height: getBarHeight(10, barFactors[i]), opacity: volume > 5 ? 1 : 0.4 }} />
              ))}
            </div>

            <div className="w-24 h-8 flex items-center justify-end">
              {hasSpoken ? (
                <span className="flex items-center text-xs text-green-600 font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Detected
                </span>
              ) : <span className="text-xs text-muted-foreground">Listening...</span>}
            </div>
          </div>
        </div>

        <div className="w-full space-y-2">
           <Select value={setupData.micDeviceId || ""} onValueChange={(val) => updateSetupData("micDeviceId", val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioInputs.length === 0 && <SelectItem value="none" disabled>No microphones found</SelectItem>}
              {audioInputs.map((mic) => (
                <SelectItem key={mic.deviceId} value={mic.deviceId}>{mic.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StepFooter 
        onBack={onBack} 
        onNext={onNext} 
        nextDisabled={!setupData.micDeviceId}
        nextLabel={hasSpoken ? "Audio Sounds Good" : "Skip Audio Check"}
      />
    </StepLayout>
  );
}