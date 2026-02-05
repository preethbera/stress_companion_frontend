import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "sonner";

const WS_URL = "ws://localhost:8000/api/v1/ws/optical";

export function useStressSocket(isActive) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Backpressure flag: true = waiting for server, false = ready to send
  const [isProcessing, setIsProcessing] = useState(false); 

  useEffect(() => {
    if (!isActive) return;

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
    };

    ws.onerror = (error) => {
      console.error("WebSocket Error:", error);
      toast.error("Connection Error", { description: "Lost connection to analysis server." });
    };

    ws.onmessage = (event) => {
      // 1. Server sent a response (e.g., stress score)
      const data = JSON.parse(event.data);
      
      // 2. Unlock the gate: We can now send the next frame
      setIsProcessing(false);

      // 3. Log or handle the data (You can expose this to state later)
      if (data.stress_level) {
        // console.log("Current Stress:", data.stress_level);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [isActive]);

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