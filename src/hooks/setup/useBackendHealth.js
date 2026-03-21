import { useState, useEffect} from "react";
import { API_ENDPOINTS } from "@/config/api";

export function useBackendHealth(url = API_ENDPOINTS.HEALTH) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [backendError, setBackendError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Server responded with an error");
        const data = await response.json();

        if (isMounted) {
          setIsConnecting(false);
          if (data.status === "ok") {
            setBackendError(false);
          } else {
            setBackendError(true);
          }
        }
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error("Backend health check failed:", err);
        }
        
        if (isMounted) {
          setIsConnecting(false);
          setBackendError(true); 
        }
      }
    };

    checkHealth();
    return () => { isMounted = false; };
  }, [url]);

  return { isConnecting, backendError };
}