import { create } from 'zustand';

const initialState = {
  sessionStatus: 'setup', // 'setup' | 'active' | 'completed'

  modelStatus: 'idle', // 'idle' | 'loading' | 'ready' | 'error'

  conversationStatus: 'idle', // 'idle' | 'started'
  
  // Stores the locked-in hardware configuration for the session
  hardwareConfig: {
    micDeviceId: null,
    opticalDeviceId: null,
    optOutOptical: false,
    thermalDeviceId: null,
    optOutThermal: false,
  },
};

export const useSessionStore = create((set) => ({
  // --- STATE ---
  ...initialState,

  // --- ACTIONS ---
  
  // Updates the master phase of the application
  setSessionStatus: (status) => set({ sessionStatus: status }),
  
  // Updates the status of the face model (e.g., during loading or error states)
  setModelStatus: (status) => set({ modelStatus: status }),

  setConversationStatus: (status) => set({ conversationStatus: status }),

  // Updates specific hardware configuration values incrementally
  setHardwareConfig: (config) => set((state) => ({
    hardwareConfig: { ...state.hardwareConfig, ...config }
  })),

  // Transitions the app to the active chat state with the finalized hardware payload
  initializeSession: (setupData) => set({
    sessionStatus: 'active',
    hardwareConfig: setupData
  }),

  // Transitions the app to the teardown and reporting phase
  completeSession: () => set({ sessionStatus: 'completed' }),

  // Resets the store
  resetSessionStore: () => set(initialState)
}));