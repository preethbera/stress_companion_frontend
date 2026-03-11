// Centralized tuning parameters for the application

export const TRACKER_CONFIG = {
  TARGET_SIZE: 224,
  FACE_PADDING_PERCENT: 0.2,
  BOX_COLOR_OK: "#00ff2a",
  BOX_COLOR_ERROR: "#ef4444",
};

export const CAMERA_CONFIG = {
  OPTICAL_FPS_RATE: 3,
  THERMAL_FPS_RATE: 3,
};

export const NETWORK_CONFIG = {
  MAX_RETRIES: 5,
};