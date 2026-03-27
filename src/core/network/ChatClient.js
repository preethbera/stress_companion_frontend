import { API_ENDPOINTS } from "@/config/api";

export class ChatClient {
  constructor() {
    // Generate a stable session ID for this class instance
    this.sessionId = crypto.randomUUID();
  }

  async sendMessage(userText, endpoint = API_ENDPOINTS.CHAT_LOCAL) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          message: userText,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Server error");
      }

      const data = await response.json();
      return data.reply;
    } catch (err) {
      console.error("ChatClient error:", err);
      throw err; // Let the hook handle the error state for the UI
    }
  }
}

// Export a singleton instance so the session ID persists across the app lifecycle
export const chatClient = new ChatClient();