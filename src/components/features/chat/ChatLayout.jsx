import React, { useRef } from "react";
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

  const cameraPanelRef = useRef(null);
  const voicePanelRef = useRef(null);
  const transcriptPanelRef = useRef(null);


  return (
    <div className="h-full w-full bg-background">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full w-full"
      >
        {/* 1. LEFT PANEL: CAMERA */}
        {showCameraPanel && (
          <>
            <ResizablePanel defaultSize={25}  minSize={200} maxSize={550} ref={cameraPanelRef}>
              <div className="h-full w-full overflow-hidden">{cameraSlot}</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* 2. MIDDLE PANEL: VOICE (The Flexible One) */}
        <ResizablePanel defaultSize={showTranscriptPanel ? (showCameraPanel ? 40 : 65) : (showCameraPanel ? 75 : 100)} minSize={500} ref={voicePanelRef}>
          <div className="h-full w-full overflow-hidden relative">
            {voiceSlot}
          </div>
        </ResizablePanel>

        {/* 3. RIGHT PANEL: TRANSCRIPT */}
        {showTranscriptPanel && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={35} minSize={300} maxSize={750} ref={transcriptPanelRef}>
              <div className="h-full w-full overflow-hidden">
                {transcriptSlot}
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
