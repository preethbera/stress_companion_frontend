import { useState, useEffect, useRef } from "react";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

// SINGLETON CACHE: Keeps model loaded even if component unmounts
let cachedDetector = null;

export function useFaceDetection() {
  const detectorRef = useRef(cachedDetector);
  const [isModelLoaded, setIsModelLoaded] = useState(!!cachedDetector);
  const [modelError, setModelError] = useState(null);

  useEffect(() => {
    if (cachedDetector) {
      setIsModelLoaded(true);
      return;
    }

    let isMounted = true;

    const loadModel = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks("/models");
        
        if (!isMounted) return;

        cachedDetector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });

        if (isMounted) {
          detectorRef.current = cachedDetector;
          setIsModelLoaded(true);
        }
      } catch (err) {
        console.error("Model Load Error:", err);
        if (isMounted) setModelError("Failed to load face detection model.");
      }
    };

    loadModel();

    return () => { isMounted = false; };
  }, []);

  return { detectorRef, isModelLoaded, modelError };
}