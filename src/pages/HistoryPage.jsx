import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRightCircle, Ban, Thermometer, Eye, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get(API_ENDPOINTS.SESSION_HISTORY);
        setSessions(response.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (isoString) => {
    const safeIso = isoString.endsWith('Z') ? isoString : isoString + 'Z';
    const d = new Date(safeIso);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getStressBadge = (avgStress) => {
    if (avgStress == null) return null;
    const value = Math.round(avgStress * 100);
    
    if (value > 70) {
      return (
        <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive ring-1 ring-inset ring-destructive/30 uppercase tracking-wider">
          <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> High Stress
        </span>
      );
    } else if (value > 40) {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-500 ring-1 ring-inset ring-yellow-500/30 uppercase tracking-wider">
          <Activity className="mr-1.5 h-3.5 w-3.5" /> Moderate
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-500 ring-1 ring-inset ring-green-500/30 uppercase tracking-wider">
        <Activity className="mr-1.5 h-3.5 w-3.5" /> Low Stress
      </span>
    );
  };

  // Group sessions by Date (e.g. "SUNDAY, JUL 26")
  const groupedSessions = sessions.reduce((acc, session) => {
    const safeIso = session.created_at.endsWith('Z') ? session.created_at : session.created_at + 'Z';
    const d = new Date(safeIso);
    const dateKey = d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(session);
    return acc;
  }, {});

  return (
    <div className="flex-1 container max-w-5xl mx-auto py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Session History</h1>
          <p className="text-muted-foreground text-lg">
            Review your past stress analysis sessions and insights.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Spinner className="h-8 w-8 text-primary opacity-50" />
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-muted/10 border-dashed border-border py-16 max-w-3xl mx-auto">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <Ban className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-xl font-semibold text-foreground">No History Found</h3>
              <p className="text-muted-foreground">You haven't completed any stress analysis sessions yet. Start a new session to track your well-being.</p>
              <Button asChild className="mt-4">
                <Link to="/chat">Start New Session</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedSessions).map(([dateKey, groupSessions]) => (
            <div key={dateKey} className="space-y-4">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase pl-1">
                {dateKey}
              </h2>
              
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                {groupSessions.map((session, index) => {
                  const time = formatTime(session.created_at);
                  const optVal = session.avg_optical_stress != null ? Math.round(session.avg_optical_stress * 100) : null;
                  const thmVal = session.avg_thermal_stress != null ? Math.round(session.avg_thermal_stress * 100) : null;
                  
                  const overallRaw = Math.max(
                    session.avg_optical_stress ?? 0, 
                    session.avg_thermal_stress ?? 0
                  );
                  const showBadge = (session.avg_optical_stress != null || session.avg_thermal_stress != null);

                  return (
                    <div 
                      key={session.session_id} 
                      className={`flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 transition-colors hover:bg-muted/40 ${
                        index !== groupSessions.length - 1 ? 'border-b border-border/50' : ''
                      }`}
                    >
                      {/* Left: Time */}
                      <div className="flex items-center md:w-1/4 pl-2">
                        <span className="font-semibold text-foreground tracking-tight text-lg">{time}</span>
                      </div>

                      {/* Middle-Left: Stress Badge */}
                      <div className="flex items-center md:w-1/4">
                        {showBadge ? getStressBadge(overallRaw) : <span className="text-sm text-muted-foreground italic">No data</span>}
                      </div>

                      {/* Middle-Right: Sensor Stats */}
                      <div className="flex items-center gap-6 md:w-1/4">
                        <div className="flex items-center gap-2">
                          <Eye className="h-5 w-5 text-muted-foreground opacity-70" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider leading-none mb-1">Optical</span>
                            <span className="font-bold text-foreground leading-none">{optVal != null ? `${optVal}%` : 'N/A'}</span>
                          </div>
                        </div>
                        
                        <div className="h-8 w-px bg-border"></div>
                        
                        <div className="flex items-center gap-2">
                          <Thermometer className="h-5 w-5 text-muted-foreground opacity-70" />
                          <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider leading-none mb-1">Thermal</span>
                            <span className="font-bold text-foreground leading-none">{thmVal != null ? `${thmVal}%` : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Action Button */}
                      <div className="flex items-center justify-end md:w-1/4">
                        <Button asChild variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
                          <Link to={`/history/${session.session_id}`}>
                             <ArrowRightCircle className="h-5 w-5 text-primary/80" /> 
                             <span className="font-medium">View Report</span>
                          </Link>
                        </Button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
