import { useState, useEffect, useRef } from "react";
import { CameraManager } from "@/core/vision/CameraManager";
import { ModelLoader } from "@/core/vision/ModelLoader";
import { detectFacesInFrame } from "@/core/vision/FaceProcessor";
import { useSessionStore } from "@/store/useSessionStore";

export function useCameraSetupStep(cameraType) {
  const isOptical = cameraType === "optical";
  
  const myDeviceKey = isOptical ? "opticalDeviceId" : "thermalDeviceId";
  const myOptOutKey = isOptical ? "optOutOptical" : "optOutThermal";
  const otherDeviceKey = isOptical ? "thermalDeviceId" : "opticalDeviceId";
  const otherOptOutKey = isOptical ? "optOutThermal" : "optOutOptical";

  const hardwareConfig = useSessionStore((state) => state.hardwareConfig);
  const setHardwareConfig = useSessionStore((state) => state.setHardwareConfig);

  const myDeviceId = hardwareConfig[myDeviceKey];
  const myOptOut = hardwareConfig[myOptOutKey];
  const otherDeviceId = hardwareConfig[otherDeviceKey];
  const otherOptOut = hardwareConfig[otherOptOutKey];

  const videoRef = useRef(null);
  const requestRef = useRef(null);
  const detectorRef = useRef(null);

  const [videoInputs, setVideoInputs] = useState([]);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isCameraLive, setIsCameraLive] = useState(false);
  const [hasFace, setHasFace] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(16 / 9);

  useEffect(() => {
    let isMounted = true;
    const fetchCameras = async () => {
      try {
        const cams = await CameraManager.getVideoDevices();
        if (isMounted) setVideoInputs(cams);
      } catch (err) { console.error(err); }
    };
    fetchCameras();
    navigator.mediaDevices.addEventListener("devicechange", fetchCameras);
    
    ModelLoader.getFaceDetector('primary')
      .then((detector) => {
        if (isMounted) {
          detectorRef.current = detector;
          setIsModelLoaded(true);
        }
      }).catch(console.error);

    return () => {
      isMounted = false;
      navigator.mediaDevices.removeEventListener("devicechange", fetchCameras);
    };
  }, []);

  const availableCameras = videoInputs.map(cam => ({
    id: cam.deviceId,
    label: cam.label,
    disabled: cam.deviceId === otherDeviceId && !otherOptOut
  }));

  const isBlocked = videoInputs.length > 0 && availableCameras.every(cam => cam.disabled) && !myOptOut;

  useEffect(() => {
    if (videoInputs.length === 0 || myOptOut) return;
    const currentlySelectedIsDisabled = availableCameras.find(c => c.id === myDeviceId)?.disabled;
    if (currentlySelectedIsDisabled) {
      setHardwareConfig({ [myDeviceKey]: null });
    } else if (!myDeviceId) {
      const firstValid = availableCameras.find(c => !c.disabled);
      if (firstValid) setHardwareConfig({ [myDeviceKey]: firstValid.id });
    }
  }, [videoInputs, availableCameras, myDeviceId, myOptOut, myDeviceKey, setHardwareConfig]);

  useEffect(() => {
    if (myOptOut || !myDeviceId) {
      setIsCameraLive(false);
      return;
    }
    let stream = null;
    let isMounted = true;

    const lockTimeout = setTimeout(() => {
      CameraManager.getStream(myDeviceId, { width: 640, height: 480 })
        .then((s) => {
          if (!isMounted) return CameraManager.stopStream(s);
          stream = s;
          
          const metadata = CameraManager.getStreamMetadata(s);
          if (metadata && metadata.aspectRatio) {
            setAspectRatio(metadata.aspectRatio);
          }

          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
            videoRef.current.onloadedmetadata = () => setIsCameraLive(true);
          }
        }).catch(console.error);
    }, 150);

    return () => {
      isMounted = false;
      clearTimeout(lockTimeout);
      if (stream) CameraManager.stopStream(stream);
      setIsCameraLive(false);
      setHasFace(false);
    };
  }, [myDeviceId, myOptOut]);

  useEffect(() => {
    if (!isCameraLive || !isModelLoaded || myOptOut || !detectorRef.current) return;
    const detectFace = () => {
      const videoEl = videoRef.current;
      if (videoEl && videoEl.readyState >= 2) {
        try {
          const detections = detectFacesInFrame(videoEl, detectorRef.current, performance.now());
          setHasFace(detections.length > 0);
        } catch (err) {}
      }
      requestRef.current = requestAnimationFrame(detectFace);
    };
    requestRef.current = requestAnimationFrame(detectFace);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isCameraLive, isModelLoaded, myOptOut]);

  const handleOptOutToggle = (val) => {
    setHardwareConfig({ [myOptOutKey]: val });
    if (val) setHardwareConfig({ [myDeviceKey]: null });
  };
  const handleDeviceSelect = (val) => setHardwareConfig({ [myDeviceKey]: val });
  
  const handleNextClick = (onNextCallback) => {
    if (isBlocked) setHardwareConfig({ [myOptOutKey]: true, [myDeviceKey]: null });
    if (onNextCallback) onNextCallback();
  };

  return {
    videoRef,
    availableCameras,
    selectedDeviceId: myDeviceId || "",
    isOptedOut: myOptOut,
    isBlocked,
    isCameraLive,
    isModelLoaded,
    hasFace,
    aspectRatio,
    onOptOutToggle: handleOptOutToggle,
    onDeviceSelect: handleDeviceSelect,
    handleNextClick
  };
}