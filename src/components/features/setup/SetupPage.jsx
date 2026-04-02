"use client";

import React, { useState, useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

import { PermissionStep } from "@/components/features/setup/PermissionStep";
import { MicrophoneStep } from "@/components/features/setup/MicrophoneStep";
import { OpticalStep } from "@/components/features/setup/OpticalStep";
import { ThermalStep } from "@/components/features/setup/ThermalStep";
import { ConnectionStep } from "@/components/features/setup/ConnectionStep";
import { autoDetectSetup } from "@/hooks/setup/autoDetectSetup";
import { usePreloadVisionModel } from "@/hooks/usePreloadVisionModel";

import { useSessionStore } from "@/store/useSessionStore";
import { useSessionManager } from "@/hooks/useSessionManager";

export default function SetupPage() {
  usePreloadVisionModel('primary');

  const [availableHardware, setAvailableHardware] = useState({
    mic: true,
    cam: true,
  });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  const steps = useMemo(() => {
    const flow = [{ id: "permission", component: PermissionStep }];
    
    if (availableHardware.mic) {
      flow.push({ id: "mic", component: MicrophoneStep });
    }
    
    if (availableHardware.cam) {
      flow.push({ id: "optical", component: OpticalStep });
      flow.push({ id: "thermal", component: ThermalStep });
    }
    
    flow.push({ id: "connection", component: ConnectionStep });
    
    return flow;
  }, [availableHardware]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  const handleNext = () =>
    setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    
  const handleBack = () => 
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));

  const { startBackendSession } = useSessionManager();

  const handlePermissionsResolved = (perms) => {
    setAvailableHardware(perms);
    handleNext();
  };

  const handleComplete = async () => {
    await startBackendSession();
    useSessionStore.getState().setSessionStatus('ready');
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    await autoDetectSetup();
    await startBackendSession();
    useSessionStore.getState().setSessionStatus('ready');
    setIsSkipping(false);
  };

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden pt-6 mx-auto px-4 md:px-8 max-w-7xl">
      <header className="w-full p-4 md:px-8 flex justify-between items-center border-b border-border shrink-0">
        <h1 className="text-lg font-bold tracking-tight">System Calibration</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={isSkipping}
          className="text-muted-foreground hover:text-foreground"
        >
          {isSkipping ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auto-Configuring...
            </>
          ) : (
            "Skip Setup"
          )}
        </Button>
      </header>

      <Progress
        value={((currentStepIndex + 1) / totalSteps) * 100}
        className="h-1 rounded-full shrink-0"
      />

      <main className="flex-1 flex flex-col items-center py-12 px-4 md:px-8 overflow-y-auto">
        <currentStep.component
          onNext={
            currentStep.id === "permission"
              ? handlePermissionsResolved
              : handleNext
          }
          onBack={handleBack}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}