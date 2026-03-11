import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Server, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { useBackendHealth } from "@/hooks/useSetupLogic";
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";

export function ConnectionStep({ setupData, onBack, onComplete }) {
  // Logic is completely abstracted into the hook
  const { isConnecting, backendError } = useBackendHealth();
  
  const hasOptOuts = setupData.optOutOptical || setupData.optOutThermal;

  return (
    <StepLayout>
      <StepHeader 
        title="System Diagnostics" 
        description="Finalizing connection to analysis servers." 
      />

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto w-full">
        <div className="w-full border rounded-xl p-6 shadow-sm bg-card flex items-center space-x-4 transition-all duration-300">
          <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center shrink-0">
            <Server className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex-1 flex flex-col">
            <span className="font-medium">FastAPI Backend</span>
            <span className="text-sm text-muted-foreground">
              {isConnecting ? "Pinging server..." : (backendError ? "Unreachable" : "Connected")}
            </span>
          </div>

          <div className="flex items-center justify-center shrink-0">
            {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : 
             !backendError ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
             <AlertTriangle className="h-5 w-5 text-destructive" />}
          </div>
        </div>

        {(!isConnecting && (backendError || hasOptOuts)) && (
          <Alert variant="warning" className="w-full bg-amber-500/10 text-amber-600 border-amber-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Experimental Phase Warning</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {backendError && <span className="block mb-1">• Backend connection failed.</span>}
              {hasOptOuts && <span className="block mb-1">• Some cameras were skipped.</span>}
              You can proceed to the UI, but real-time stress analysis will be limited or unavailable.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <StepFooter 
        onBack={onBack} 
        onNext={onComplete} 
        nextDisabled={isConnecting}
        nextLabel="Enter Companion"
      />
    </StepLayout>
  );
}