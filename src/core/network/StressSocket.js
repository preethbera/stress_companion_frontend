import { API_ENDPOINTS } from "@/config/api";
import { NETWORK_CONFIG } from "@/config/constants";

export class StressSocket {
  constructor(endpoint, sessionId, onMessage, onStatusChange) {
    this.endpoint = endpoint;
    this.sessionId = sessionId;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange; // Lets React know when connected/disconnected

    this.ws = null;
    this.isProcessing = false; // Pure JS boolean. No React re-renders!
    this.shouldConnect = false;
    this.retryCount = 0;
    this.reconnectTimeout = null;
    this.systemName = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);
  }

  connect() {
    this.shouldConnect = true;
    this._updateStatus("connecting");

    let wsUrl = API_ENDPOINTS.STRESS_WS(this.endpoint);
    if (this.sessionId) {
      wsUrl += `?session_id=${this.sessionId}`;
    }
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      if (import.meta.env.DEV) console.log(`${this.systemName} WS: Connected`);
      this._updateStatus("connected");
      this.isProcessing = false;
      this.retryCount = 0;
    };

    this.ws.onclose = (event) => {
      // 1000 = Normal Closure (We intentionally closed it)
      if (event.code === 1000 || !this.shouldConnect) {
        this._updateStatus("disconnected");
        this.isProcessing = false;
        return;
      }

      if (import.meta.env.DEV) {
        console.warn(`${this.systemName} WS Dropped (Code: ${event.code}). Retrying...`);
      }
      
      this._updateStatus("disconnected");
      this.isProcessing = false;
      this._handleReconnect();
    };

    this.ws.onerror = () => {
      // Handled primarily by onclose
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.isProcessing = false; // Unlock for the next frame
        if (this.onMessage) this.onMessage(data);
      } catch (err) {
        if (import.meta.env.DEV) console.error(`${this.systemName} Parse Error`, err);
        this.isProcessing = false;
      }
    };
  }

  disconnect() {
    this.shouldConnect = false;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, "Session ended");
      this.ws = null;
    }
    this._updateStatus("disconnected");
  }

  sendFrame(blob) {
    if (this.ws?.readyState === WebSocket.OPEN && !this.isProcessing) {
      this.isProcessing = true;
      this.ws.send(blob);
    }
  }

  _handleReconnect() {
    if (this.retryCount < NETWORK_CONFIG.MAX_RETRIES) {
      const delay = Math.min(1000 * (2 ** this.retryCount), 10000); 
      this.reconnectTimeout = setTimeout(() => {
        if (this.shouldConnect) {
          this.retryCount += 1;
          this.connect();
        }
      }, delay);
    } else {
      this._updateStatus("error");
      // You can trigger a UI toast from the hook via the status change
    }
  }

  _updateStatus(status) {
    if (this.onStatusChange) this.onStatusChange(status);
  }
}