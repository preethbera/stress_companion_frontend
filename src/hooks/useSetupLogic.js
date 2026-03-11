import { useState, useEffect, useRef } from "react";
import { useFaceDetection } from "@/hooks/useFaceDetection";

// ============================================================================
// 1. HARDWARE PERMISSION CHECKER
// ============================================================================
export function usePermissionCheck() {
  const [isChecking, setIsChecking] = useState(true);
  const [perms, setPerms] = useState({
    mic: false,
    cam: false,
    checked: false,
  });

  useEffect(() => {
    let isMounted = true;

    const checkPerms = async () => {
      let mic = false,
        cam = false;
      try {
        // Try both first
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        stream.getTracks().forEach((t) => t.stop());
        mic = true;
        cam = true;
      } catch (err) {
        // Fallback: Try individually
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          aStream.getTracks().forEach((t) => t.stop());
          mic = true;
        } catch (e) {}
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          vStream.getTracks().forEach((t) => t.stop());
          cam = true;
        } catch (e) {}
      }

      if (isMounted) {
        setPerms({ mic, cam, checked: true });
        setIsChecking(false);
      }
    };

    checkPerms();
    return () => {
      isMounted = false;
    };
  }, []);

  return { isChecking, perms };
}

// ============================================================================
// 2. DEVICE ENUMERATION (Base Utility)
// ============================================================================
export function useMediaDevices() {
  const [devices, setDevices] = useState({ audioInputs: [], videoInputs: [] });

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();

        // Filter out virtual endpoints created by the OS/Browser
        const cleanAudioInputs = mediaDevices.filter(
          (d) =>
            d.kind === "audioinput" &&
            d.deviceId &&
            d.deviceId !== "default" &&
            d.deviceId !== "communications" &&
            !d.label.startsWith("Default - ") &&
            !d.label.startsWith("Communications - "),
        );

        const videoInputs = mediaDevices.filter(
          (d) => d.kind === "videoinput" && d.deviceId,
        );

        setDevices({ audioInputs: cleanAudioInputs, videoInputs });
      } catch (error) {
        console.error("Error fetching devices", error);
      }
    };

    fetchDevices();
    navigator.mediaDevices.addEventListener("devicechange", fetchDevices);
    return () =>
      navigator.mediaDevices.removeEventListener("devicechange", fetchDevices);
  }, []);

  return devices;
}

// ============================================================================
// 3. MICROPHONE SETUP & VOLUME TRACKER
// ============================================================================
export function useMicrophoneSetup(setupData, updateSetupData) {
  const { audioInputs } = useMediaDevices();
  const [volume, setVolume] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false);

  // Auto-select first mic
  useEffect(() => {
    if (audioInputs.length > 0 && !setupData.micDeviceId) {
      updateSetupData("micDeviceId", audioInputs[0].deviceId);
    }
  }, [audioInputs, setupData.micDeviceId, updateSetupData]);

  // Audio Volume stream
  useEffect(() => {
    if (!setupData.micDeviceId) return;

    let audioContext, analyser, microphone, dataArray, animationId;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: setupData.micDeviceId } },
        });

        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);

        microphone.connect(analyser);
        analyser.fftSize = 256;
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setVolume(sum / dataArray.length);
          animationId = requestAnimationFrame(updateVolume);
        };
        updateVolume();
      } catch (e) {
        console.error("Audio volume error:", e);
      }
    };

    startAudio();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (audioContext && audioContext.state !== "closed") audioContext.close();
    };
  }, [setupData.micDeviceId]);

  // Check if user has spoken
  useEffect(() => {
    if (volume > 20 && !hasSpoken) {
      setHasSpoken(true);
    }
  }, [volume, hasSpoken]);

  return { audioInputs, volume, hasSpoken };
}

// ============================================================================
// 4. CAMERA SETUP (DRY Hook for Core Hardware/ML connection)
// ============================================================================
export function useCameraSetup(deviceKey, optOutKey, setupData, updateSetupData, otherDeviceId = null) {
  const { videoInputs } = useMediaDevices();
  const deviceId = setupData[deviceKey];
  const isOptedOut = setupData[optOutKey];

  const { detectorRef, isModelLoaded } = useFaceDetection();
  
  const videoRef = useRef(null);
  const requestRef = useRef(null);
  
  const [hasFace, setHasFace] = useState(false);
  const [isCameraLive, setIsCameraLive] = useState(false);

  useEffect(() => {
    if (videoInputs.length > 0 && !deviceId && !isOptedOut) {
      // Find a camera that isn't the one passed into 'otherDeviceId'
      const availableCam = videoInputs.find(cam => cam.deviceId !== otherDeviceId);
      
      if (availableCam) {
        updateSetupData(deviceKey, availableCam.deviceId);
      }
      // If the ONLY camera plugged in is already in use by Optical, 
      // we do NOTHING. It stays blank, forcing the user to either opt-out 
      // or plug in a second camera.
    }
  }, [videoInputs, deviceId, isOptedOut, updateSetupData, deviceKey, otherDeviceId]);

  // Start Video Stream
  useEffect(() => {
    if (isOptedOut || !deviceId) {
      setIsCameraLive(false);
      return;
    }
    
    let stream = null;
    navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
    })
    .then(s => {
      stream = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => setIsCameraLive(true);
      }
    })
    .catch(console.error);

    return () => stream && stream.getTracks().forEach(t => t.stop());
  }, [deviceId, isOptedOut]);

  // Run Face Detection
  useEffect(() => {
    if (!isCameraLive || !isModelLoaded || isOptedOut || !detectorRef?.current) return;

    const detectFace = () => {
      const videoEl = videoRef.current;
      if (videoEl && videoEl.readyState >= 2) {
        try {
          const result = detectorRef.current.detectForVideo(videoEl, performance.now());
          setHasFace(result.detections.length > 0);
        } catch (err) {}
      }
      requestRef.current = requestAnimationFrame(detectFace);
    };
    
    requestRef.current = requestAnimationFrame(detectFace);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isCameraLive, isModelLoaded, isOptedOut, detectorRef]);

  return { videoInputs, videoRef, isCameraLive, hasFace, isModelLoaded };
}

// ============================================================================
// 5. CAMERA STEP LOGIC (State & Interaction Manager for UI)
// ============================================================================
export function useCameraStepLogic({
  setupData,
  updateSetupData,
  onNext,
  deviceKey,
  optOutKey,
  otherDeviceKey,
  otherOptOutKey,
  stepName
}) {
  const isOptOut = setupData[optOutKey];
  const deviceId = setupData[deviceKey];
  const isOtherOptOut = setupData[otherOptOutKey];
  const otherDeviceId = setupData[otherDeviceKey];

  const { videoInputs, videoRef, isCameraLive, hasFace, isModelLoaded } = useCameraSetup(
    deviceKey,
    optOutKey,
    setupData,
    updateSetupData,
    !isOtherOptOut ? otherDeviceId : null
  );

  const otherCamera = videoInputs.find(cam => cam.deviceId === otherDeviceId);
  const otherCameraName = otherCamera?.label || "Your primary camera";

  const isOnlyCameraUsedByOther = videoInputs.length > 0 && videoInputs.every(
    (cam) => cam.deviceId === otherDeviceId && !isOtherOptOut
  );

  const isBlocked = isOnlyCameraUsedByOther && !isOptOut;

  const handleNextClick = () => {
    if (isBlocked) {
      updateSetupData(optOutKey, true);
      updateSetupData(deviceKey, null);
    }
    onNext();
  };

  const handleOptOutToggle = (val) => {
    updateSetupData(optOutKey, val);
    if (val) updateSetupData(deviceKey, null);
  };

  const isNextDisabled = !isOptOut && !isBlocked && (!hasFace || !isModelLoaded);

  const showPlaceholder = isOptOut || isBlocked || videoInputs.length === 0;
  
  const otherStepName = stepName === "Optical" ? "Thermal" : "Optical";
  let previewLabel = `${stepName} Camera Disabled`;
  if (videoInputs.length === 0) previewLabel = "No Camera Found";
  else if (isBlocked && !isOptOut) previewLabel = `Camera in use by ${otherStepName}`;

  return {
    videoInputs, videoRef, isCameraLive, hasFace, isModelLoaded,
    isOptOut, deviceId, otherCameraName, isBlocked,
    handleNextClick, handleOptOutToggle, isNextDisabled,
    showPlaceholder, previewLabel, otherStepName
  };
}

// ============================================================================
// 6. BACKEND DIAGNOSTICS
// ============================================================================
export function useBackendHealth(url = "http://localhost:8000/health") {
  const [isConnecting, setIsConnecting] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        // 1. Make the actual network request to FastAPI
        const response = await fetch(url);

        // 2. Check if the HTTP status code is 200 OK
        if (!response.ok) {
          throw new Error("Server responded with an error");
        }

        // 3. Parse the JSON response
        const data = await response.json();

        if (isMounted) {
          setIsConnecting(false);
          // 4. Verify your exact payload {"status": "ok"}
          if (data.status === "ok") {
            setBackendError(false); // Success! Green checkmark will show.
          } else {
            setBackendError(true);
          }
        }
      } catch (err) {
        console.error("Backend health check failed:", err);
        if (isMounted) {
          setIsConnecting(false);
          setBackendError(true); // Network error, server down, or CORS issue
        }
      }
    };

    checkHealth();
    return () => {
      isMounted = false;
    };
  }, [url]);

  return { isConnecting, backendError };
}