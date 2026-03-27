import React, { memo } from "react";
import {
  Mic,
  MicOff,
  Play,
  Maximize2,
  MessageSquare,
  PhoneOff,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { RadialVisualizer } from "@/components/ui/RadialVisualizer";
import { useUIStore } from "@/store/useUIStore";
import { useSessionStore } from "@/store/useSessionStore";

const VoicePanel = ({
  aiState = "idle",
  isMicOn = false,
  volume = 0,
  onStop,
  onToggleMic,
}) => {
  // Session State
  const hasStarted = useSessionStore(
    (state) => state.sessionStatus === "active",
  );
  const setSessionStatus = useSessionStore(
    (state) => state.setSessionStatus,
  );

  // UI State
  const isOpticalVisible = useUIStore((state) => state.isOpticalVisible);
  const isThermalVisible = useUIStore((state) => state.isThermalVisible);
  const isTranscriptVisible = useUIStore((state) => state.isTranscriptVisible);
  const toggleCameraPanel = useUIStore((state) => state.toggleCameraPanel);
  const toggleTranscript = useUIStore((state) => state.toggleTranscript);

  const isCameraPanelVisible = isOpticalVisible || isThermalVisible;

  return (
    <section
      aria-label="Voice Interaction Panel"
      className="grid grid-cols-[1fr_auto_1fr] grid-rows-[auto_1fr_auto] w-full h-full bg-background p-4 gap-4 overflow-hidden"
    >
      <div className="col-start-3 row-start-1 justify-self-end">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={toggleTranscript}
                className="rounded-full h-10 w-10 bg-background/50 backdrop-blur-sm border-border hover:bg-background transition-colors"
                aria-label={
                  isTranscriptVisible ? "Collapse Visuals" : "Open Chat"
                }
              >
                {isTranscriptVisible ? (
                  <Maximize2 className="h-5 w-5" />
                ) : (
                  <MessageSquare className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isTranscriptVisible ? "Collapse Visuals" : "Open Chat"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="col-start-2 row-start-2 place-self-center text-center">
        {!hasStarted ? (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
            <div className="w-28 h-28 mb-8 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
              <Mic className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold text-foreground">
              Ready to Talk
            </h3>
            <p className="mt-3 text-muted-foreground max-w-sm">
              Click{" "}
              <span className="font-semibold text-primary">
                Start Conversation
              </span>{" "}
              to begin
            </p>
          </div>
        ) : (
          <RadialVisualizer
            state={aiState === "idle" ? "disconnected" : aiState}
            text={aiState}
            barCount={64}
            radius={96}
            className="text-primary"
          />
        )}
      </div>

      <div className="col-start-2 row-start-3 justify-self-center mb-8 shadow-md">
        {!hasStarted ? (
          <Button
            onClick={() => setSessionStatus("active")}
            type="button"
            size="2xl"
            className="text-lg font-bold rounded-xl"
          >
            <Play
              className="h-6 w-6 mr-2"
              strokeWidth={4}
              absoluteStrokeWidth
            />
            Start Conversation
          </Button>
        ) : (
          <ButtonGroup>
            <Button
              onClick={onToggleMic}
              variant={isMicOn ? "destructive" : "outline"}
              type="button"
              size="2xl"
              className="relative overflow-hidden"
            >
              {/* Subtle background pulse tied to volume */}
              {isMicOn && (
                <div
                  className="absolute inset-0 bg-black/10 transition-transform duration-75 ease-linear"
                  style={{ transform: `scale(${1 + volume})` }}
                />
              )}

              {/* Icon scales directly with the volume */}
              <div
                className="relative z-10 flex items-center justify-center transition-transform duration-75 ease-linear"
                style={{
                  transform: `scale(${isMicOn ? 1 + volume * 0.4 : 1})`,
                }}
              >
                {isMicOn ? (
                  <Mic className="size-6" />
                ) : (
                  <MicOff className="size-6" />
                )}
              </div>
            </Button>
            <Button
              variant={isCameraPanelVisible ? "secondary" : "outline"}
              size="2xl"
              onClick={toggleCameraPanel}
              type="button"
              title="Toggle Camera"
            >
              <Camera className="size-7" />
            </Button>
            <Button
              title="End Session"
              variant="outline"
              onClick={onStop}
              type="button"
              size="2xl"
            >
              <PhoneOff className="size-6" />
            </Button>
          </ButtonGroup>
        )}
      </div>
    </section>
  );
};

export default memo(VoicePanel);
