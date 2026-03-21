import { AudioStreamer } from "@/core/audio/AudioStreamer";
import { CameraManager } from "@/core/vision/CameraManager";
import { useSessionStore } from "@/store/useSessionStore";

export const autoDetectSetup = async () => {
  const currentSetupData = useSessionStore.getState().hardwareConfig;

  try {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (e) {
      console.warn("Permissions not fully granted during auto-skip");
    }

    const mics = await AudioStreamer.getMicrophones();
    const cams = await CameraManager.getVideoDevices();

    let autoData = { ...currentSetupData };

    if (mics.length > 0 && !autoData.micDeviceId) {
      autoData.micDeviceId = mics[0].deviceId;
    }

    if (cams.length === 0) {
      autoData.optOutOptical = true;
      autoData.optOutThermal = true;
    } else if (cams.length === 1) {
      const isThermal = /thermal|flir|infiray|seek|mlx/i.test(cams[0].label);
      if (isThermal) {
         autoData.thermalDeviceId = cams[0].deviceId;
         autoData.optOutThermal = false;
         autoData.optOutOptical = true;
      } else {
         autoData.opticalDeviceId = cams[0].deviceId;
         autoData.optOutOptical = false;
         autoData.optOutThermal = true; 
      }
    } else {
      const thermalRegex = /thermal|flir|infiray|seek|mlx/i;
      const thermalCam = cams.find(c => thermalRegex.test(c.label));

      if (thermalCam) {
        autoData.thermalDeviceId = thermalCam.deviceId;
        autoData.optOutThermal = false;
        
        const opticalCam = cams.find(c => c.deviceId !== thermalCam.deviceId);
        if (opticalCam) {
          autoData.opticalDeviceId = opticalCam.deviceId;
          autoData.optOutOptical = false;
        }
      } else {
        autoData.opticalDeviceId = cams[0].deviceId;
        autoData.optOutOptical = false;
        autoData.thermalDeviceId = cams[1].deviceId;
        autoData.optOutThermal = false;
      }
    }

    // Mutate the global store and finish. No return statement needed.
    useSessionStore.getState().setHardwareConfig(autoData);

  } catch (err) {
    if (import.meta.env.DEV) console.error("Auto-detect failed:", err);
  }
};