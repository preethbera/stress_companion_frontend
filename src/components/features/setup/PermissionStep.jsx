import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StepLayout, StepHeader, StepFooter } from "./SharedComponents";
import { usePermissionCheck } from "@/hooks/setup/usePermissionCheck";

export function PermissionStep({ onNext }) {
  const { isChecking, perms } = usePermissionCheck();

  const allGranted = perms.mic && perms.cam;

  return (
    <StepLayout>
      <StepHeader
        title="Hardware Access"
        description="Checking permissions for your cameras and microphone."
      />

      <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-lg mx-auto w-full">
        <div className="w-full border border-border rounded-xl p-6 space-y-5 shadow-sm bg-card text-card-foreground">
          {[
            { label: "Microphone", granted: perms.mic },
            { label: "Optical Camera", granted: perms.cam },
            {
              label: "Thermal Camera (USB)",
              sub: "Included with video permission",
              granted: perms.cam,
            },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-foreground">{item.label}</span>
                {item.sub && (
                  <span className="text-xs text-muted-foreground">
                    {item.sub}
                  </span>
                )}
              </div>
              {isChecking ? (
                <Spinner className="h-5 w-5 text-muted-foreground" />
              ) : item.granted ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
            </div>
          ))}
        </div>

        {!isChecking && !allGranted && (
          <Alert
            variant="warning"
            className="w-full bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-400 border-amber-500/20"
          >
            <AlertTriangle className="h-4 w-4 !text-amber-700 dark:!text-amber-400" />
            <AlertTitle>Missing Permissions</AlertTitle>
            <AlertDescription className="text-sm mt-1 text-amber-800/90 dark:text-amber-400/90">
              {!perms.mic && !perms.cam
                ? "Neither microphone nor camera access was granted."
                : !perms.mic
                  ? "Microphone access is missing."
                  : "Camera access is missing."}{" "}
              You can continue, but those features will be disabled.
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