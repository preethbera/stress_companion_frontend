import { useEffect } from "react";
import { ModelLoader } from "@/core/vision/ModelLoader";
import { useSessionStore } from "@/store/useSessionStore";

export function usePreloadVisionModel(instanceId) {
  const setModelStatus = useSessionStore((state) => state.setModelStatus);

  useEffect(() => {
    let isMounted = true;

    const preloadVisionModel = async () => {
      setModelStatus('loading');
      try {
        await ModelLoader.getFaceDetector(instanceId);
        if (isMounted) setModelStatus('ready');
      } catch (error) {
        console.error("Failed to preload vision model", error);
        if (isMounted) setModelStatus('error');
      }
    };

    preloadVisionModel();

    return () => { isMounted = false; };
  }, [setModelStatus]);
}