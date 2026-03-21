const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  CHAT: `${API_BASE}/api/v1/chat`,
  STRESS_WS: (systemType) => `${WS_BASE}/api/v1/ws/${systemType}`,
};