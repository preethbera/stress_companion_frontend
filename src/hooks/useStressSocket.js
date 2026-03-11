import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/config/api";
import { NETWORK_CONFIG } from "@/config/constants";

/**
 * A universal WebSocket hook for streaming frames to the backend.
 * * @param {string} endpoint - The specific API endpoint (e.g., "optical" or "thermal")
 * @param {boolean} shouldConnect - Controlled by the parent (isActive && cameraReady)
 * @param {function} onMessage - Callback for parsed JSON data from the server
 */
export function useStressSocket(endpoint, shouldConnect, onMessage = null) {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCount = useRef(0);

  // Status: 'disconnected' | 'connecting' | 'connected' | 'error'
  const [status, setStatus] = useState("disconnected");
  const [isProcessing, setIsProcessing] = useState(false); 

  // Keep callback fresh to avoid stale closures
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!shouldConnect) return;

    setStatus("connecting");
    
    // Use the dynamic URL builder from your centralized API config
    const wsUrl = API_ENDPOINTS.STRESS_WS(endpoint);
    const ws = new WebSocket(wsUrl);
    
    socketRef.current = ws;

    // Helper for logs/toasts (e.g., turns "optical" into "Optical")
    const systemName = endpoint.charAt(0).toUpperCase() + endpoint.slice(1);

    ws.onopen = () => {
      // Only log successful connections in development mode
      if (import.meta.env.DEV) {
        console.log(`${systemName} WS: Connected`);
      }
      setStatus("connected");
      setIsProcessing(false);
      retryCount.current = 0; // Reset retries on success
    };

    ws.onclose = (event) => {
      // 1000 = Normal Closure (e.g., user stopped session)
      if (event.code === 1000 || !shouldConnect) {
        setStatus("disconnected");
        setIsProcessing(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.warn(`${systemName} WS Dropped (Code: ${event.code}). Retrying...`);
      }
      
      setStatus("disconnected");
      setIsProcessing(false);

      // Auto-Reconnect Strategy (Exponential Backoff)
      if (retryCount.current < NETWORK_CONFIG.MAX_RETRIES) {
        const delay = Math.min(1000 * (2 ** retryCount.current), 10000); 
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            retryCount.current += 1;
            connect();
          }
        }, delay);
      } else {
        setStatus("error");
        toast.error(`${systemName} System Failed`, { 
          description: "Analysis server unreachable." 
        });
      }
    };

    ws.onerror = () => {
      // Handled by onclose
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsProcessing(false); // Unlock for next frame
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error(`${systemName} Parse Error`, err);
        }
        setIsProcessing(false);
      }
    };
  }, [shouldConnect, endpoint]);

  // MAIN EFFECT: The Gatekeeper
  useEffect(() => {
    if (shouldConnect) {
      connect();
    } else {
      // FORCE CLOSE if Gatekeeper says no
      if (socketRef.current) {
        socketRef.current.close(1000, "Session ended or Camera failed");
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      setStatus("disconnected");
      retryCount.current = 0;
    }

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [shouldConnect, connect]);

  const sendFrame = useCallback((blob) => {
    if (socketRef.current?.readyState === WebSocket.OPEN && !isProcessing) {
      setIsProcessing(true);
      socketRef.current.send(blob);
    }
  }, [isProcessing]);

  return { 
    sendFrame, 
    status, 
    isConnected: status === "connected" 
  };
}