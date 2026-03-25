import { create } from 'zustand';

const initialState = {
  isOpticalVisible: false,
  isThermalVisible: false,
  isTranscriptVisible: true,
};

export const useUIStore = create((set) => ({
  // --- STATE ---
  ...initialState,

  // --- ACTIONS ---
  toggleOptical: () => set((state) => ({ isOpticalVisible: !state.isOpticalVisible })),
  toggleThermal: () => set((state) => ({ isThermalVisible: !state.isThermalVisible })),
  toggleTranscript: () => set((state) => ({ isTranscriptVisible: !state.isTranscriptVisible })),

  // Convenience action: If one camera is opened, you might want to ensure the other logic is handled
  toggleCameraPanel: () => set((state) => {
    const isAnyOpen = state.isOpticalVisible || state.isThermalVisible;
    return {
      isOpticalVisible: !isAnyOpen,
      isThermalVisible: !isAnyOpen
    };
  }),

  // Resets the store
  resetUIStore: () => set(initialState)
}));