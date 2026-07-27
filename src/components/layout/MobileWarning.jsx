import React, { useState } from "react";
import { Smartphone, MonitorPlay } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileWarning() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center md:hidden">
      <div className="bg-card border border-border p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-6 flex flex-col items-center animate-in zoom-in duration-300">
        <div className="relative mb-2">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
          <MonitorPlay className="h-8 w-8 text-blue-500 absolute -bottom-1 -right-1 bg-card rounded-full p-1.5 shadow-sm border border-border" />
        </div>
        
        <div className="space-y-3">
          <h2 className="text-2xl font-bold tracking-tight">Desktop Required</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Stress Companion requires a webcam and processing power that is best experienced on a laptop or desktop computer.
          </p>
          <p className="text-sm font-medium text-foreground">
            Please switch to a computer for the full experience.
          </p>
        </div>

        <Button 
          variant="ghost" 
          className="w-full mt-4 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setDismissed(true)}
        >
          I understand, continue anyway
        </Button>
      </div>
    </div>
  );
}
