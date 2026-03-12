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
import { autoDetectSetup } from "@/hooks/useSetupLogic";
export default function SetupPage({ onComplete }) {
  const [setupData, setSetupData] = useState({
    micDeviceId: null,
    opticalDeviceId: null,
    optOutOptical: false,
    thermalDeviceId: null,
    optOutThermal: false,
  });

  const [availableHardware, setAvailableHardware] = useState({ mic: true, cam: true });
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSkipping, setIsSkipping] = useState(false);

  const updateSetupData = (key, value) => setSetupData((prev) => ({ ...prev, [key]: value }));

  const steps = useMemo(() => {
    const flow = [{ id: "permission", component: PermissionStep }];
    if (availableHardware.mic) flow.push({ id: "mic", component: MicrophoneStep });
    if (availableHardware.cam) {
      flow.push({ id: "optical", component: OpticalStep });
      flow.push({ id: "thermal", component: ThermalStep });
    }
    flow.push({ id: "connection", component: ConnectionStep });
    return flow;
  }, [availableHardware]);

  const totalSteps = steps.length;
  const currentStep = steps[currentStepIndex];

  const handleNext = () => setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  const handleBack = () => setCurrentStepIndex((prev) => Math.max(prev - 1, 0));

  const handlePermissionsResolved = (perms) => {
    setAvailableHardware(perms);
    handleNext();
  };

  // ✨ THE FIX: Smart Skip Handler
  const handleSkip = async () => {
    setIsSkipping(true);
    const optimizedData = await autoDetectSetup(setupData);
    setSetupData(optimizedData);
    onComplete(optimizedData);
    setIsSkipping(false);
  };

  const isWideStep = currentStep.id === "optical" || currentStep.id === "thermal";

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden pt-6">
      <header className="w-full p-4 md:px-8 flex justify-between items-center border-b shrink-0">
        <h1 className="text-lg font-bold tracking-tight">System Calibration</h1>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSkip} 
          disabled={isSkipping}
        >
          {isSkipping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Auto-Configuring...</> : "Skip Setup"}
        </Button>
      </header>

      <Progress value={((currentStepIndex + 1) / totalSteps) * 100} className="h-1 rounded-none shrink-0" />

      <main className="flex-1 flex flex-col items-center py-12 px-4 md:px-8 overflow-y-auto">
        <div className={`w-full flex flex-col transition-all duration-300 ${isWideStep ? "max-w-5xl" : "max-w-2xl"}`}>
          <currentStep.component 
            setupData={setupData} 
            updateSetupData={updateSetupData} 
            onNext={currentStep.id === "permission" ? handlePermissionsResolved : handleNext} 
            onBack={handleBack} 
            onComplete={() => onComplete(setupData)}
          />
        </div>
      </main>
    </div>
  );
}