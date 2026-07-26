import { create } from 'zustand';
import { sessionService } from '@/lib/services/sessionService';

const initialState = {
  activeSessionId: null,
  sessionStats: null,
  isFetchingStats: false,

  sessionStatus: 'setup', // 'setup' | 'ready' | 'preparing' | 'active' | 'completed'

  modelStatus: 'idle', // 'idle' | 'loading' | 'ready' | 'error'

  selectedModel: 'gemini-api',

  aiState: 'idle', // 'idle' | 'listening' | 'thinking' | 'speaking'
  isMicOn: false,
  
  // Stores the locked-in hardware configuration for the session
  hardwareConfig: {
    micDeviceId: null,
    opticalDeviceId: null,
    optOutOptical: false,
    thermalDeviceId: null,
    optOutThermal: false,
  },
};

export const useSessionStore = create((set, get) => ({
  // --- STATE ---
  ...initialState,
  chatHistory: [],

  // --- ACTIONS ---
  
  setAiState: (state) => set({ aiState: state }),
  setIsMicOn: (isOn) => set({ isMicOn: isOn }),
  
  // Updates the master phase of the application
  setSessionStatus: (status) => set({ sessionStatus: status }),

  // Updates the selected LLM model
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  // Updates the status of the face model (e.g., during loading or error states)
  setModelStatus: (status) => set({ modelStatus: status }),

  // Updates specific hardware configuration values incrementally
  setHardwareConfig: (config) => set((state) => ({
    hardwareConfig: { ...state.hardwareConfig, ...config }
  })),

  // Transitions the app to the active chat state with the finalized hardware payload
  initializeSession: (setupData) => set({
    sessionStatus: 'ready',
    hardwareConfig: setupData
  }),

  // Transitions the app to the teardown and reporting phase
  completeSession: () => set({ sessionStatus: 'completed' }),

  setSessionStats: (stats) => set({ sessionStats: stats }),
  
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  
  setChatHistory: (messages) => set({ chatHistory: messages }),
  
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),

  // Resets the store
  resetSessionStore: () => set({ ...initialState, chatHistory: [] })
}));