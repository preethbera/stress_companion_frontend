import { useEffect, useRef } from "react";
import { toast } from "sonner";

// Configuration
const CAPTURE_INTERVAL_MS = 150; 
const TARGET_SIZE = 224;         
const FACE_PADDING_PERCENT = 0.2;
const BOX_COLOR_OK = "#00ff2a";
const BOX_COLOR_ERROR = "#ef4444";

/**
 * Helper: Normalizes differences between <video> and <img> elements
 */
const getMediaMetadata = (el) => {
  if (!el) return { width: 0, height: 0, isReady: false };

  if (el.tagName === "VIDEO") {
    return {
      width: el.videoWidth,
      height: el.videoHeight,
      isReady: el.readyState >= 2, // HAVE_CURRENT_DATA
    };
  } 
  
  if (el.tagName === "IMG") {
    return {
      width: el.naturalWidth,
      height: el.naturalHeight,
      isReady: el.complete && el.naturalWidth > 0,
    };
  }

  return { width: 0, height: 0, isReady: false };
};

export function useFaceTracker(mediaRef, detector, isActive, onFrameBlob) {
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
    // We check mediaRef.current, not just mediaRef
    if (!isActive || !mediaRef.current || !detector) return;
    
    // Reset warmup on activation
    isWarmupRef.current = true;
    const warmupTimer = setTimeout(() => isWarmupRef.current = false, 3000);

    const detect = () => {
      const mediaEl = mediaRef.current;
      const overlay = overlayRef.current;

      // Safety check using our helper
      const { width, height, isReady } = getMediaMetadata(mediaEl);

      if (!mediaEl || !detector || !overlay || !isReady) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }

      // Detect
      // Note: detectForVideo accepts HTMLVideoElement OR HTMLImageElement 
      // as long as we provide the timestamp.
      try {
        const startTime = performance.now();
        const result = detector.detectForVideo(mediaEl, startTime);
        const detections = result.detections;
        
        // Update Overlay dimensions
        if (overlay.width !== width || overlay.height !== height) {
           overlay.width = width;
           overlay.height = height;
        }
  
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);
  
        if (detections.length > 1) {
          latestDetectionRef.current = null;
          triggerAlert("Multiple faces", "Ensure only one person is visible.");
          detections.forEach(d => drawBox(ctx, d.boundingBox, BOX_COLOR_ERROR));
        } else if (detections.length === 0) {
          latestDetectionRef.current = null;
          // Optional: You might want to disable "No face" alerts for Thermal 
          // if detection is spotty.
          triggerAlert("No face detected", "Please align your face.");
        } else {
          latestDetectionRef.current = detections[0];
          drawBox(ctx, detections[0].boundingBox, BOX_COLOR_OK);
        }
      } catch (err) {
        console.warn("Detection failed:", err);
      }
      
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(requestRef.current);
      clearTimeout(warmupTimer);
    };
  }, [isActive, detector, mediaRef]);

  // --- 2. Data Export Loop ---
  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      const detection = latestDetectionRef.current;
      const mediaEl = mediaRef.current;
      
      if (!detection || !mediaEl || !cropCanvasRef.current) return;

      const { width, height } = getMediaMetadata(mediaEl);
      const { boundingBox } = detection;
      const ctx = cropCanvasRef.current.getContext("2d");

      if (cropCanvasRef.current.width !== TARGET_SIZE) {
        cropCanvasRef.current.width = TARGET_SIZE;
        cropCanvasRef.current.height = TARGET_SIZE;
      }

      // Calculate Crop
      const paddingX = boundingBox.width * FACE_PADDING_PERCENT;
      const paddingY = boundingBox.height * FACE_PADDING_PERCENT;
      
      // Ensure we don't crop outside the image bounds
      const x = Math.max(0, boundingBox.originX - paddingX);
      const y = Math.max(0, boundingBox.originY - paddingY);
      const w = Math.min(width - x, boundingBox.width + (paddingX * 2));
      const h = Math.min(height - y, boundingBox.height + (paddingY * 2));

      // Draw & Convert
      ctx.drawImage(mediaEl, x, y, w, h, 0, 0, TARGET_SIZE, TARGET_SIZE);

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
  }, [isActive, mediaRef, onFrameBlob]);

  const drawBox = (ctx, box, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
  };

  return { overlayRef, cropCanvasRef };
}