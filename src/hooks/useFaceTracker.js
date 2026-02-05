import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Configuration
const CAPTURE_INTERVAL_MS = 150; 
const TARGET_SIZE = 256;         
const FACE_PADDING_PERCENT = 0.2;
const BOX_COLOR_OK = "#00ff2a";
const BOX_COLOR_ERROR = "#ef4444";

export function useFaceTracker(videoRef, detector, isActive, onFrameBlob) {
  const overlayRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const requestRef = useRef(null);
  const latestDetectionRef = useRef(null);
  
  const lastAlertTimeRef = useRef(0);
  const isWarmupRef = useRef(true);

  const triggerAlert = (message, description) => {
    const now = Date.now();
    if (!isWarmupRef.current && (now - lastAlertTimeRef.current > 3000)) {
      toast.warning(message, { description, duration: 2500, position: "top-center" });
      lastAlertTimeRef.current = now;
    }
  };

  // --- 1. Visual Detection Loop ---
  useEffect(() => {
    if (!isActive || !videoRef.current || !detector) return;
    
    // Reset warmup on activation
    isWarmupRef.current = true;
    const warmupTimer = setTimeout(() => isWarmupRef.current = false, 3000);

    const detect = () => {
      const video = videoRef.current;
      const overlay = overlayRef.current;

      // Safety check: ensure video is playing and has data
      if (!video || !detector || !overlay || video.readyState < 2) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }

      // Detect
      const result = detector.detectForVideo(video, performance.now());
      const detections = result.detections;
      
      // Update Overlay dimensions only if changed (prevents flicker)
      if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
         overlay.width = video.videoWidth;
         overlay.height = video.videoHeight;
      }

      const ctx = overlay.getContext("2d");
      ctx.clearRect(0, 0, overlay.width, overlay.height);

      if (detections.length > 1) {
        latestDetectionRef.current = null;
        triggerAlert("Multiple faces", "Ensure only one person is visible.");
        detections.forEach(d => drawBox(ctx, d.boundingBox, BOX_COLOR_ERROR));
      } else if (detections.length === 0) {
        latestDetectionRef.current = null;
        triggerAlert("No face detected", "Please align your face.");
      } else {
        latestDetectionRef.current = detections[0];
        drawBox(ctx, detections[0].boundingBox, BOX_COLOR_OK);
      }
      
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(requestRef.current);
      clearTimeout(warmupTimer);
    };
  }, [isActive, detector, videoRef]);

  // --- 2. Data Export Loop ---
  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      const detection = latestDetectionRef.current;
      const video = videoRef.current;
      // Note: We don't check !detector here because this loop depends only on the cached detection result
      if (!detection || !video || !cropCanvasRef.current) return;

      const { boundingBox } = detection;
      const ctx = cropCanvasRef.current.getContext("2d");

      // Set canvas size ONLY if needed (prevents heavy context reset)
      if (cropCanvasRef.current.width !== TARGET_SIZE) {
        cropCanvasRef.current.width = TARGET_SIZE;
        cropCanvasRef.current.height = TARGET_SIZE;
      }

      // Calculate Crop
      const paddingX = boundingBox.width * FACE_PADDING_PERCENT;
      const paddingY = boundingBox.height * FACE_PADDING_PERCENT;
      const x = Math.max(0, boundingBox.originX - paddingX);
      const y = Math.max(0, boundingBox.originY - paddingY);
      const w = Math.min(video.videoWidth - x, boundingBox.width + (paddingX * 2));
      const h = Math.min(video.videoHeight - y, boundingBox.height + (paddingY * 2));

      // Draw & Convert
      ctx.drawImage(video, x, y, w, h, 0, 0, TARGET_SIZE, TARGET_SIZE);

      if (onFrameBlob) {
        cropCanvasRef.current.toBlob(
          (blob) => { if (blob) onFrameBlob(blob); },
          "image/jpeg",
          0.8
        );
      }
    };

    const interval = setInterval(processFrame, CAPTURE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isActive, videoRef, onFrameBlob]);

  const drawBox = (ctx, box, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
  };

  return { overlayRef, cropCanvasRef };
}