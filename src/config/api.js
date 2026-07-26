export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE}/health`,
  CHAT_LOCAL: `${API_BASE}/api/v1/chat/local`,
  CHAT_GEMINI_API: `${API_BASE}/api/v1/chat/gemini`,
  STRESS_WS: (systemType) => `${WS_BASE}/api/v1/ws/${systemType}`,


  // Auth
  AUTH_REGISTER: `${API_BASE}/api/v1/auth/register`,
  AUTH_LOGIN: `${API_BASE}/api/v1/auth/login`,
  AUTH_ME: `${API_BASE}/api/v1/auth/me`,
  AUTH_PROFILE_IMAGE: `${API_BASE}/api/v1/auth/me/profile-image`,

  // Sessions
  SESSIONS: `${API_BASE}/api/v1/sessions/`,
  SESSION_ID: (sessionId) => `${API_BASE}/api/v1/sessions/${sessionId}`,
  SESSION_SUMMARY: (sessionId) => `${API_BASE}/api/v1/sessions/${sessionId}/summary`,
  SESSION_STATS: `${API_BASE}/api/v1/sessions/stats`,
  SESSION_MESSAGES: (sessionId) => `${API_BASE}/api/v1/sessions/${sessionId}/messages`,
  SESSION_HISTORY: `${API_BASE}/api/v1/sessions/history`,
  SESSION_DETAILS: (sessionId) => `${API_BASE}/api/v1/sessions/${sessionId}/details`,
};

export const LLM_MODELS = [
  { id: "qwen-local", name: "Qwen Local", endpoint: API_ENDPOINTS.CHAT_LOCAL },
  { id: "gemini-api", name: "Gemini API", endpoint: API_ENDPOINTS.CHAT_GEMINI_API },
];