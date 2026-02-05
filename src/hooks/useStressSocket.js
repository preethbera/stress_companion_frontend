import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const WS_URL = "ws://localhost:8000/api/v1/ws/optical";

/**
 * @param {boolean} isActive - Whether the socket should be open
 * @param {function} onMessage - (Optional) Callback when data is received { stress_score: number }
 */
export function useStressSocket(isActive, onMessage = null) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Backpressure flag: true = waiting for server, false = ready to send
  const [isProcessing, setIsProcessing] = useState(false); 

  // REF PATTERN: Keeps the callback fresh without forcing the socket to reconnect
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!isActive) return;

    // Initialize WebSocket
    const ws = new WebSocket(WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("Stress WS Connected");
      setIsConnected(true);
      setIsProcessing(false);
    };

    ws.onclose = () => {
      console.log("Stress WS Disconnected");
      setIsConnected(false);
      setIsProcessing(false); // Reset lock on close
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      toast.error("Connection Error", { description: "Lost connection to analysis server." });
      setIsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        // 1. Server sent a response
        const data = JSON.parse(event.data);
        
        // 2. Unlock the gate: We can now send the next frame
        setIsProcessing(false);

        // 3. Pass data up to the parent (useChatSession)
        if (onMessageRef.current) {
          onMessageRef.current(data);
        }
      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
        // Even if parsing fails, we must unlock to allow future frames
        setIsProcessing(false);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [isActive]); // Only reconnect if isActive changes (not onMessage)

  const sendFrame = useCallback((blob) => {
    // Safety Checks
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    // THROTTLING: If server is still busy, DROP this frame.
    if (isProcessing) return; 

    // Send & Lock
    setIsProcessing(true);
    socketRef.current.send(blob);

  }, [isProcessing]);

  return { sendFrame, isConnected };
}