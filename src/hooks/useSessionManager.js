import { useCallback, useState } from 'react';
import { sessionService } from '@/lib/services/sessionService';
import { useSessionStore } from '@/store/useSessionStore';

export function useSessionManager() {
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const setSessionStats = useSessionStore(state => state.setSessionStats);
  const setActiveSessionId = useSessionStore(state => state.setActiveSessionId);
  const activeSessionId = useSessionStore(state => state.activeSessionId);
  const setSessionStatus = useSessionStore(state => state.setSessionStatus);

  const fetchDashboardStats = useCallback(async () => {
    setIsFetchingStats(true);
    try {
      const stats = await sessionService.getSessionStats();
      setSessionStats(stats);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setIsFetchingStats(false);
    }
  }, [setSessionStats]);

  const startBackendSession = useCallback(async () => {
    setIsStarting(true);
    try {
      const response = await sessionService.createSession();
      setActiveSessionId(response.session_id);
      return response.session_id;
    } catch (err) {
      console.error("Failed to start backend session:", err);
      return null;
    } finally {
      setIsStarting(false);
    }
  }, [setActiveSessionId]);

  const finishBackendSession = useCallback(async () => {
    if (!activeSessionId) return;
    setIsFinishing(true);
    try {
      await sessionService.updateSessionStatus(activeSessionId, "completed");
      await sessionService.generateSessionSummary(activeSessionId);
    } catch (err) {
      console.error("Failed to finalize backend session:", err);
    } finally {
      setActiveSessionId(null);
      setSessionStatus("completed");
      setIsFinishing(false);
    }
  }, [activeSessionId, setActiveSessionId, setSessionStatus]);

  return {
    fetchDashboardStats,
    startBackendSession,
    finishBackendSession,
    isFetchingStats,
    isStarting,
    isFinishing
  };
}
