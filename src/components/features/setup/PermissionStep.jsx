import React from "react";
import { AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";
import { usePermissionCheck } from "@/hooks/useSetupLogic";

export function PermissionStep({ onNext }) {
  // Logic is completely abstracted away into the hook
  const { isChecking, perms } = usePermissionCheck();

  const allGranted = perms.mic && perms.cam;

  return (
    <StepLayout>
      <StepHeader 
        title="Hardware Access" 
        description="Checking permissions for your cameras and microphone." 
      />

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto w-full">
        <div className="w-full border rounded-xl p-6 space-y-5 shadow-sm bg-card">
          {[
            { label: "Microphone", granted: perms.mic },
            { label: "Optical Camera", granted: perms.cam },
            { label: "Thermal Camera (USB)", sub: "Included with video permission", granted: perms.cam }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium">{item.label}</span>
                {item.sub && <span className="text-xs text-muted-foreground">{item.sub}</span>}
              </div>
              {isChecking ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : 
               item.granted ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
               <XCircle className="h-5 w-5 text-destructive" />}
            </div>
          ))}
        </div>

        {!isChecking && !allGranted && (
          <Alert variant="warning" className="w-full bg-amber-500/10 text-amber-600 border-amber-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Missing Permissions</AlertTitle>
            <AlertDescription className="text-sm mt-1">
              {!perms.mic && !perms.cam ? "Neither microphone nor camera access was granted." :
               !perms.mic ? "Microphone access is missing." : "Camera access is missing."}
              {" "}You can continue, but those features will be disabled.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <StepFooter 
        showBack={false}
        onNext={() => onNext({ mic: perms.mic, cam: perms.cam })} 
        nextDisabled={isChecking}
        nextLabel={allGranted ? "Continue" : "Continue Anyway"}
      />
    </StepLayout>
  );
}