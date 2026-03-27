import { useEffect, useRef } from "react";
import { MediaRegistry } from "@/core/vision/MediaRegistry";
import { CameraManager } from "@/core/vision/CameraManager";
import { ModelLoader } from "@/core/vision/ModelLoader";
import {
  extractFrameAsBlob,
  normalizeBoundingBox,
} from "@/core/vision/VideoUtils";
import {
  detectFacesInFrame,
  getFaceCountStatus,
  getTrackedFace,
} from "@/core/vision/FaceProcessor";
import { StressSocket } from "@/core/network/StressSocket";

import { useVisionStore } from "@/store/useVisionStore";
import { useSessionStore } from "@/store/useSessionStore";

export function useVisionPipeline({
  cameraId,
  endpointName,
  onDataReceived,
  targetFps = 3,
}) {
  const isOptical = cameraId === "optical";

  // Dynamically resolve hardware configuration based on the provided cameraId
  const deviceId = useSessionStore((state) =>
    isOptical
      ? state.hardwareConfig.opticalDeviceId
      : state.hardwareConfig.thermalDeviceId,
  );

  const optOut = useSessionStore((state) =>
    isOptical
      ? state.hardwareConfig.optOutOptical
      : state.hardwareConfig.optOutThermal,
  );

  const sessionStatus = useSessionStore(
    (state) => state.sessionStatus,
  );
  const modelStatus = useSessionStore((state) => state.modelStatus);
  const setSessionStatus = useSessionStore((state) => state.setSessionStatus);

  const isPreparing = sessionStatus === "preparing";
  const isActive = !optOut && (sessionStatus === "active" || isPreparing);

  useEffect(() => {
    if (isPreparing && modelStatus === "ready") {
      const checkAndTransition = () => {
        const { optical, thermal } = useVisionStore.getState();
        const { hardwareConfig } = useSessionStore.getState();
        const optOutOptical = hardwareConfig.optOutOptical;
        const optOutThermal = hardwareConfig.optOutThermal;

        const opticalReady = optOutOptical || !!optical.cameraMetadata;
        const thermalReady = optOutThermal || !!thermal.cameraMetadata;

        if (opticalReady && thermalReady) {
          setSessionStatus("active");
        }
      };

      checkAndTransition();

      const unsubscribe = useVisionStore.subscribe((state) => {
        const { optical, thermal } = state;
        const { hardwareConfig } = useSessionStore.getState();
        const optOutOptical = hardwareConfig.optOutOptical;
        const optOutThermal = hardwareConfig.optOutThermal;

        const opticalReady = optOutOptical || !!optical.cameraMetadata;
        const thermalReady = optOutThermal || !!thermal.cameraMetadata;

        if (opticalReady && thermalReady) {
          setSessionStatus("active");
        }
      });

      return () => unsubscribe();
    }
  }, [isPreparing, modelStatus, setSessionStatus]);

  const previousCenterRef = useRef(null);
  const socketRef = useRef(null);
  const loopRef = useRef(null);

  const callbacksRef = useRef({ onDataReceived, targetFps });

  useEffect(() => {
    callbacksRef.current = { onDataReceived, targetFps };
  }, [onDataReceived, targetFps]);

  useEffect(() => {
    if (!isActive || !deviceId) {
      useVisionStore.getState().resetCamera(cameraId);
      return;
    }

    let isMounted = true;

    useVisionStore.getState().updateCameraState(cameraId, {
      connectionStatus: "connecting",
      error: null,
    });

    const initializePipeline = async () => {
      try {
        const stream = await CameraManager.getStream(deviceId);
        if (!isMounted) return;

        MediaRegistry.registerStream(cameraId, stream);

        const metadata = MediaRegistry.getMetadata(cameraId);
        if (isMounted) {
          useVisionStore.getState().updateCameraState(cameraId, {
            cameraMetadata: metadata,
            aspectRatio: metadata.aspectRatio || "16 / 9",
          });
        }

        const socket = new StressSocket(
          endpointName,
          (data) => {
            if (callbacksRef.current.onDataReceived) {
              callbacksRef.current.onDataReceived(data);
            }
          },
          (status) => {
            if (isMounted) {
              useVisionStore.getState().updateCameraState(cameraId, {
                connectionStatus: status, 
              });
            }
          },
        );

        socket.connect();
        socketRef.current = socket;

        // Fetch the specific model instance based on the cameraId
        const detector = await ModelLoader.getFaceDetector(cameraId);
        if (!isMounted) return;

        const processFrame = async () => {
          if (!isMounted) return;

          const videoElement = MediaRegistry.getVideoElement(cameraId);

          if (!videoElement || videoElement.videoWidth === 0) {
            loopRef.current = setTimeout(processFrame, 200);
            return;
          }

          const detections = detectFacesInFrame(
            videoElement,
            detector,
            performance.now(),
          );
          const status = getFaceCountStatus(detections);

          let currentWarning = null;

          if (status === "NO_FACE") {
            currentWarning = "Please face the camera";
            useVisionStore.getState().updateBoundingBox(cameraId, null);
            previousCenterRef.current = null;

            // EXPLICITLY dispatch NO_FACE so ChatPage can toast and log it
            if (callbacksRef.current.onDataReceived) {
              callbacksRef.current.onDataReceived({ status: "NO_FACE" });
            }
          } else if (status === "MULTIPLE_FACES") {
            currentWarning = "Multiple people detected";

            // EXPLICITLY dispatch MULTIPLE_FACES so ChatPage can toast and log it
            if (callbacksRef.current.onDataReceived) {
              callbacksRef.current.onDataReceived({ status: "MULTIPLE_FACES" });
            }
          }

          useVisionStore
            .getState()
            .setWarnings(cameraId, currentWarning ? [currentWarning] : []);

          let targetFace = null;

          if (status !== "NO_FACE") {
            targetFace = getTrackedFace(detections, previousCenterRef.current);

            if (targetFace) {
              const box = normalizeBoundingBox(targetFace.boundingBox);
              const vW = videoElement.videoWidth;
              const vH = videoElement.videoHeight;

              useVisionStore.getState().updateBoundingBox(cameraId, {
                x: (box.x / vW) * 100,
                y: (box.y / vH) * 100,
                width: (box.width / vW) * 100,
                height: (box.height / vH) * 100,
              });

              previousCenterRef.current = {
                x: box.x + box.width / 2,
                y: box.y + box.height / 2,
              };
            }
          }

          if (
            targetFace &&
            socket &&
            !socket.isProcessing &&
            socket.ws?.readyState === WebSocket.OPEN
          ) {
            try {
              const blob = await extractFrameAsBlob(
                videoElement,
                targetFace.boundingBox,
              );
              socket.sendFrame(blob);
            } catch (err) {
              console.error(`VisionPipeline [${cameraId}]: Crop error`, err);
            }
          }

          if (isMounted) {
            const delayMs = 1000 / callbacksRef.current.targetFps;
            loopRef.current = setTimeout(processFrame, delayMs);
          }
        };

        processFrame();
      } catch (err) {
        if (isMounted) {
          useVisionStore.getState().updateCameraState(cameraId, {
            error: "Hardware access denied or unavailable",
            connectionStatus: "disconnected",
          });
        }
      }
    };

    initializePipeline();

    return () => {
      isMounted = false;
      if (loopRef.current) clearTimeout(loopRef.current);
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      MediaRegistry.destroyStream(cameraId);
    };
  }, [cameraId, deviceId, isActive, endpointName]);

  return null;
}
