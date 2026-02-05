import { useState, useEffect, useRef } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

export function useFaceDetection() {
  const detectorRef = useRef(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        // 1. Load the WASM binary from local /models folder
        const vision = await FilesetResolver.forVisionTasks(
          "/models" 
        );

        // 2. Create the detector using the local TFLite model
        detectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite",
            delegate: "GPU", // Keeps performance high
          },
          runningMode: "VIDEO",
        });

        setIsModelLoaded(true);
      } catch (err) {
        console.error("Model Load Error:", err);
        setModelError("Failed to load face detection model. Check /public/models.");
      }
    };

    loadModel();
  }, []);

  return { detectorRef, isModelLoaded, modelError };
}