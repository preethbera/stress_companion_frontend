import React, { useRef } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

import { useUIStore } from "@/store/useUIStore";

export default function ChatLayout({ cameraSlot, voiceSlot, transcriptSlot }) {
  const isOpticalVisible = useUIStore((state) => state.isOpticalVisible);
  const isThermalVisible = useUIStore((state) => state.isThermalVisible);
  const isTranscriptVisible = useUIStore((state) => state.isTranscriptVisible);

  const isCameraPanelVisible = isOpticalVisible || isThermalVisible;

  const cameraPanelRef = useRef(null);
  const voicePanelRef = useRef(null);
  const transcriptPanelRef = useRef(null);

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full w-full bg-background"
    >
      {/* 1. LEFT PANEL: CAMERA */}
      {isCameraPanelVisible && (
        <>
          <ResizablePanel
            defaultSize={25}
            minSize={200}
            maxSize={550}
            ref={cameraPanelRef}
            className="h-full w-full overflow-hidden rounded-lg"
          >
            {cameraSlot}
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* 2. MIDDLE PANEL: VOICE (The Flexible One) */}
      <ResizablePanel
        defaultSize={
          isTranscriptVisible
            ? isCameraPanelVisible
              ? 40
              : 65
            : isCameraPanelVisible
              ? 75
              : 100
        }
        minSize={500}
        ref={voicePanelRef}
      >
        {voiceSlot}
      </ResizablePanel>

      {/* 3. RIGHT PANEL: TRANSCRIPT */}
      {isTranscriptVisible && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={35}
            minSize={300}
            maxSize={750}
            ref={transcriptPanelRef}
          >
            {transcriptSlot}
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
