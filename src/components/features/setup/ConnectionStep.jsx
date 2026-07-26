import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Server, CheckCircle2, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useBackendHealth } from "@/hooks/setup/useBackendHealth";
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";
import { useSessionStore } from "../../../store/useSessionStore";

export function ConnectionStep({ onBack, onComplete }) {
  const { isConnecting, backendError } = useBackendHealth();
  const hardwareConfig = useSessionStore((state) => state.hardwareConfig);
  
  const hasOptOuts = hardwareConfig.optOutOptical || hardwareConfig.optOutThermal;

  return (
    <StepLayout>
      <StepHeader 
        title="System Diagnostics" 
        description="Finalizing connection to analysis servers." 
      />

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto w-full">
        <div className="w-full border rounded-lg p-6 shadow-sm bg-card text-card-foreground flex items-center space-x-4 transition-all duration-300">
          <div className="h-10 w-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center shrink-0">
            <Server className="h-5 w-5" />
          </div>
          
          <div className="flex-1 flex flex-col">
            <span className="font-medium text-foreground">FastAPI Backend</span>
            <span className="text-sm text-muted-foreground">
              {isConnecting ? "Pinging server..." : (backendError ? "Unreachable" : "Connected")}
            </span>
          </div>

          <div className="flex items-center justify-center shrink-0">
            {isConnecting ? (
              <Spinner className="h-5 w-5 text-muted-foreground" />
            ) : !backendError ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-destructive" />
            )}
          </div>
        </div>

        {(!isConnecting && (backendError || hasOptOuts)) && (
          <Alert 
            variant="warning" 
            className="w-full bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-500/20"
          >
            <AlertTriangle className="h-4 w-4 !text-amber-700 dark:!text-amber-400" />
            <AlertTitle>Experimental Phase Warning</AlertTitle>
            <AlertDescription className="text-sm mt-1 text-amber-800/90 dark:text-amber-400/90">
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