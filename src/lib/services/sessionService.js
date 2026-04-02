import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";

export const sessionService = {
  /**
   * Initializes a new session on the backend.
   * @returns {Promise<{session_id: string, status: string, created_at: string}>}
   */
  createSession: async () => {
    const response = await api.post(API_ENDPOINTS.SESSIONS);
    return response.data;
  },

  /**
   * Updates an existing session's status.
   * @param {string} sessionId 
   * @param {string} status - typically 'completed'
   */
  updateSessionStatus: async (sessionId, status) => {
    const response = await api.put(API_ENDPOINTS.SESSION_ID(sessionId), { status });
    return response.data;
  },

  /**
   * Instructs the backend to execute an expensive aggregate summary generation for the session.
   * @param {string} sessionId 
   */
  generateSessionSummary: async (sessionId) => {
    const response = await api.post(API_ENDPOINTS.SESSION_SUMMARY(sessionId));
    return response.data;
  },

  /**
   * Fetches chronological and aggregate performance data spanning all user sessions.
   * Useful for Dashboards.
   */
  getSessionStats: async () => {
    const response = await api.get(API_ENDPOINTS.SESSION_STATS);
    return response.data;
  },

  /**
   * Retrieves the chat history for a specific session.
   * @param {string} sessionId 
   */
  getChatHistory: async (sessionId) => {
    const response = await api.get(API_ENDPOINTS.SESSION_MESSAGES(sessionId));
    return response.data;
  },

  /**
   * Saves a chat message inside the session.
   * @param {string} sessionId 
   * @param {string} role - 'user' or 'assistant'
   * @param {string} content 
   */
  saveChatMessage: async (sessionId, role, content) => {
    const response = await api.post(API_ENDPOINTS.SESSION_MESSAGES(sessionId), {
      session_id: sessionId,
      role,
      content
    });
    return response.data;
  }
};
