import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const WS_URL = "ws://localhost:8000/api/v1/ws/thermal";
const MAX_RETRIES = 5;

export function useThermalStressSocket(shouldConnect, onMessage = null) {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const retryCount = useRef(0);

  const [status, setStatus] = useState("disconnected");
  const [isProcessing, setIsProcessing] = useState(false); 

  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = useCallback(() => {
    if (!shouldConnect) return;

    setStatus("connecting");
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Thermal WS: Connected");
      setStatus("connected");
      setIsProcessing(false);
      retryCount.current = 0;
    };

    ws.onclose = (event) => {
      if (event.code === 1000 || !shouldConnect) {
        setStatus("disconnected");
        setIsProcessing(false);
        return;
      }

      console.warn(`Thermal WS Dropped. Retrying...`);
      setStatus("disconnected");
      setIsProcessing(false);

      if (retryCount.current < MAX_RETRIES) {
        const delay = Math.min(1000 * (2 ** retryCount.current), 10000);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (shouldConnect) {
            retryCount.current += 1;
            connect();
          }
        }, delay);
      } else {
        setStatus("error");
        toast.error("Thermal System Failed", { description: "Analysis server unreachable." });
      }
    };

    ws.onerror = () => { };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setIsProcessing(false);
        if (onMessageRef.current) onMessageRef.current(data);
      } catch (err) {
        setIsProcessing(false);
      }
    };
  }, [shouldConnect]);

  useEffect(() => {
    if (shouldConnect) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close(1000, "Stop");
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
    status, // Required by useChatSession
    isConnected: status === "connected" 
  };
}