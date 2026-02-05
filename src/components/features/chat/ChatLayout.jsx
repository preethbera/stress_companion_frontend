import React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function ChatLayout({
  showCameraPanel,
  showTranscriptPanel,
  cameraSlot,
  voiceSlot,
  transcriptSlot,
}) {
  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full rounded-lg border-t"
      >
        {/* 1. LEFT PANEL: CAMERA */}
        {showCameraPanel && (
          <>
            <ResizablePanel defaultSize={25}  minSize={200} maxSize={450}>
              <div className="h-full w-full overflow-hidden">{cameraSlot}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* 2. MIDDLE PANEL: VOICE (The Flexible One) */}
        <ResizablePanel defaultSize={showTranscriptPanel ? (showCameraPanel ? 40 : 65) : (showCameraPanel ? 75 : 100)} minSize={300}>
          <div className="h-full w-full overflow-hidden relative">
            {voiceSlot}
          </div>
        </ResizablePanel>

        {/* 3. RIGHT PANEL: TRANSCRIPT */}
        {showTranscriptPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={200} maxSize={750}>
              <div className="h-full w-full overflow-hidden border-l border-border/50">
                {transcriptSlot}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
