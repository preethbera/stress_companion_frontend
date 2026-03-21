import { create } from 'zustand';

const initialCameraState = {
  connectionStatus: 'disconnected', // 'disconnected' | 'connecting' | 'connected'
  error: null,
  warnings: [],
  aspectRatio: "16 / 9",
  boundingBox: null,
};

export const useVisionStore = create((set) => ({
  // --- STATE ---
  optical: { ...initialCameraState },
  thermal: { ...initialCameraState },

  // --- ACTIONS ---
  
  // 1. Full State Update (used for connecting/disconnecting/errors)
  updateCameraState: (cameraId, updates) => set((state) => ({
    [cameraId]: {
      ...state[cameraId],
      ...updates
    }
  })),

  // 2. High-Frequency Fast Path (Optimized specifically for 30 FPS tracking)
  updateBoundingBox: (cameraId, boundingBox) => set((state) => ({
    [cameraId]: {
      ...state[cameraId],
      boundingBox
    }
  })),

  // 3. Warnings Update (Arrays need to be handled carefully)
  setWarnings: (cameraId, warningsArray) => set((state) => ({
    [cameraId]: {
      ...state[cameraId],
      warnings: warningsArray
    }
  })),

  // 4. Teardown
  resetCamera: (cameraId) => set((state) => ({
    [cameraId]: { ...initialCameraState }
  }))
}));