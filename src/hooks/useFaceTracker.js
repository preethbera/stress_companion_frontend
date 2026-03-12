import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { TRACKER_CONFIG } from "@/config/constants";

// --- HELPER MATH FUNCTIONS FOR FACE LOCKING ---
const getCenter = (box) => ({
  x: box.originX + box.width / 2,
  y: box.originY + box.height / 2
});

const getDistance = (center1, center2) => {
  return Math.sqrt(Math.pow(center1.x - center2.x, 2) + Math.pow(center1.y - center2.y, 2));
};

const getArea = (box) => box.width * box.height;

export function useFaceTracker(videoRef, detector, isActive, onFrameBlob, fps = 5) {
  const overlayRef = useRef(null);
  const cropCanvasRef = useRef(null);
  const requestRef = useRef(null);
  
  // Stores the exact box of the face we are currently "locked" onto
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

  const drawBox = (ctx, box, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(box.originX, box.originY, box.width, box.height);
  };

  // --- 1. VISUAL DETECTION & FACE LOCKING LOOP ---
  useEffect(() => {
    if (!isActive || !videoRef.current || !detector) return;
    
    isWarmupRef.current = true;
    const warmupTimer = setTimeout(() => isWarmupRef.current = false, 3000);

    const detect = () => {
      const videoEl = videoRef.current;
      const overlay = overlayRef.current;

      // Ensure it's a video and actually playing
      if (!videoEl || videoEl.readyState < 2 || !detector || !overlay) {
        requestRef.current = requestAnimationFrame(detect);
        return;
      }

      try {
        const result = detector.detectForVideo(videoEl, performance.now());
        const detections = result.detections;
        
        // Sync canvas to video dimensions
        if (overlay.width !== videoEl.videoWidth || overlay.height !== videoEl.videoHeight) {
           overlay.width = videoEl.videoWidth;
           overlay.height = videoEl.videoHeight;
        }
  
        const ctx = overlay.getContext("2d");
        ctx.clearRect(0, 0, overlay.width, overlay.height);
  
        // SCENARIO A: No Face
        if (detections.length === 0) {
          latestDetectionRef.current = null;
          triggerAlert("No face detected", "Please align your face.");
        } 
        
        // SCENARIO B: Exactly One Face
        else if (detections.length === 1) {
          latestDetectionRef.current = detections[0];
          drawBox(ctx, detections[0].boundingBox, TRACKER_CONFIG.BOX_COLOR_OK);
        } 
        
        // SCENARIO C: Multiple Faces (The Lock-On Logic)
        else {
          let targetFace = detections[0];
          
          if (latestDetectionRef.current) {
            // Find the face closest to the one we were tracking a millisecond ago
            const prevCenter = getCenter(latestDetectionRef.current.boundingBox);
            let minDistance = Infinity;
            
            detections.forEach(d => {
              const center = getCenter(d.boundingBox);
              const dist = getDistance(prevCenter, center);
              if (dist < minDistance) {
                minDistance = dist;
                targetFace = d;
              }
            });
          } else {
            // If we just booted up and see multiple faces, lock onto the biggest one
            let maxArea = 0;
            detections.forEach(d => {
              const area = getArea(d.boundingBox);
              if (area > maxArea) {
                maxArea = area;
                targetFace = d;
              }
            });
          }
          
          latestDetectionRef.current = targetFace;
          triggerAlert("Multiple faces", "Tracking the closest/largest face.");

          // Draw the locked face in Green, the intruders in Red
          detections.forEach(d => {
            const isTarget = d === targetFace;
            drawBox(ctx, d.boundingBox, isTarget ? TRACKER_CONFIG.BOX_COLOR_OK : TRACKER_CONFIG.BOX_COLOR_ERROR);
          });
        }
      } catch (err) {
        if (import.meta.env.DEV) console.warn("Detection failed:", err);
      }
      
      requestRef.current = requestAnimationFrame(detect);
    };

    requestRef.current = requestAnimationFrame(detect);

    return () => {
      cancelAnimationFrame(requestRef.current);
      clearTimeout(warmupTimer);
    };
  }, [isActive, detector, videoRef]);

  // --- 2. DATA EXPORT LOOP ---
  useEffect(() => {
    if (!isActive) return;

    const processFrame = () => {
      const detection = latestDetectionRef.current;
      const videoEl = videoRef.current;
      
      // If we don't have a video or canvas, abort.
      if (!videoEl || !cropCanvasRef.current) return;

      // SCENARIO A: Tell the backend we lost the face!
      if (!detection) {
        if (onFrameBlob) onFrameBlob(null, "NO_FACE");
        return;
      }

      // SCENARIO B: Crop and send the locked face
      const { boundingBox } = detection;
      const ctx = cropCanvasRef.current.getContext("2d");

      if (cropCanvasRef.current.width !== TRACKER_CONFIG.TARGET_SIZE) {
        cropCanvasRef.current.width = TRACKER_CONFIG.TARGET_SIZE;
        cropCanvasRef.current.height = TRACKER_CONFIG.TARGET_SIZE;
      }

      const paddingX = boundingBox.width * TRACKER_CONFIG.FACE_PADDING_PERCENT;
      const paddingY = boundingBox.height * TRACKER_CONFIG.FACE_PADDING_PERCENT;
      
      const x = Math.max(0, boundingBox.originX - paddingX);
      const y = Math.max(0, boundingBox.originY - paddingY);
      const w = Math.min(videoEl.videoWidth - x, boundingBox.width + (paddingX * 2));
      const h = Math.min(videoEl.videoHeight - y, boundingBox.height + (paddingY * 2));

      ctx.drawImage(videoEl, x, y, w, h, 0, 0, TRACKER_CONFIG.TARGET_SIZE, TRACKER_CONFIG.TARGET_SIZE);

      if (onFrameBlob) {
        cropCanvasRef.current.toBlob(
          (blob) => { if (blob) onFrameBlob(blob, "FACE_DETECTED"); },
          "image/jpeg",
          0.8
        );
      }
    };

    const intervalTime = 1000 / fps;
    const interval = setInterval(processFrame, intervalTime);
    
    return () => clearInterval(interval);
  }, [isActive, videoRef, onFrameBlob, fps]);

  return { overlayRef, cropCanvasRef };
}