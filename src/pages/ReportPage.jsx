import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Activity, AlertTriangle, Clock, Thermometer, ChevronDown, ChevronUp, FileJson, FileText, Eye, Calendar, Ban, MessageCircle
} from "lucide-react";

import api from "@/lib/axios";
import { API_ENDPOINTS } from "@/config/api";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import TimeSeriesChart from "@/components/ui/TimeSeriesChart";

// --- Configuration ---
const CHART_CONFIG = {
  optical: {
    label: "Optical Camera",
    dataKey: "score",
    icon: Eye,
    colorClass: "text-blue-500",
    stroke: "#3b82f6", 
    fillStart: "#3b82f6",
    gradientId: "colorOptical",
    domain: [0, 100],
    formatter: (val) => val,
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" 
  },
  thermal: {
    label: "Thermal Camera",
    dataKey: "prob",
    icon: Thermometer,
    colorClass: "text-orange-500",
    stroke: "#f97316", 
    fillStart: "#f97316",
    gradientId: "colorThermal",
    domain: [0, 1],
    formatter: (val) => val * 100,
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  }
};

// --- Helper Functions ---
const calculateStats = (data, type) => {
  const config = CHART_CONFIG[type];
  if (!data || !data.length) return { avg: 0, peak: 0, hasData: false };

  const validData = data.filter(d => d.status === "FACE_DETECTED" && d[config.dataKey] !== null);
  if (validData.length === 0) return { avg: 0, peak: 0, hasData: false };

  const values = validData.map(d => {
    const raw = d[config.dataKey];
    return type === 'thermal' ? raw * 100 : raw;
  });

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / values.length),
    peak: Math.round(Math.max(...values)),
    hasData: true
  };
};

const calculateDuration = (optical, thermal, createdAt) => {
  const combinedTimestamps = [...optical, ...thermal].map(d => d.timestamp).sort((a, b) => a - b);
  
  // Fix UTC parsing for createdAt
  const safeCreatedAt = createdAt ? (createdAt.endsWith('Z') ? createdAt : createdAt + 'Z') : null;
  const fallbackDate = new Date(safeCreatedAt || Date.now()).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  if (combinedTimestamps.length === 0) {
    return { duration: "0s", date: fallbackDate };
  }
  const diffMs = combinedTimestamps[combinedTimestamps.length - 1] - combinedTimestamps[0];
  const m = Math.floor(diffMs / 60000);
  const s = Math.floor((diffMs % 60000) / 1000);
  
  return {
    duration: m > 0 ? `${m}m ${s}s` : `${s}s`,
    date: new Date(combinedTimestamps[0]).toLocaleDateString(undefined, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  };
};

// --- Sub-Components ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, alertCondition = false }) => (
  <Card className="bg-card border-border shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      {Icon && <Icon className={`h-4 w-4 ${colorClass}`} />}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold ${alertCondition ? "text-destructive" : "text-foreground"}`}>
        {value}
      </div>
      {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
    </CardContent>
  </Card>
);

const StressChart = ({ data, config }) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">
        Timeline ({config.label})
      </CardTitle>
      <div className="flex items-center text-xs text-muted-foreground">
        <svg className="w-4 h-4 mr-2 rounded-full bg-muted/30 border border-muted-foreground/20" viewBox="0 0 100 100">
          <defs>
            <pattern id="legend-stripes" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="20" fill="currentColor" className="text-muted-foreground opacity-30" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#legend-stripes)" />
        </svg>
        No Face Detected
      </div>
    </CardHeader>
      <CardContent className="p-0 pb-4">
        <TimeSeriesChart data={data} config={config} height={300} />
      </CardContent>
    </Card>
  );
};

const AnalysisSection = ({ type, data, stats }) => {
  const config = CHART_CONFIG[type];
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center gap-2 mb-2">
        <config.icon className={`h-5 w-5 ${config.colorClass}`} />
        <h2 className="text-xl font-semibold">{config.label} Analysis</h2>
      </div>
      {stats.hasData ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title={`Average ${config.label} Stress`} value={`${stats.avg}%`} subtext="Baseline score for this session" icon={Activity} colorClass={config.colorClass} />
            <StatCard title={`Peak ${config.label} Stress`} value={`${stats.peak}%`} subtext="Highest recorded intensity" icon={AlertTriangle} colorClass={stats.peak > 70 ? "text-destructive" : "text-yellow-500"} alertCondition={stats.peak > 70} />
          </div>
          <StressChart data={data} config={config} />
        </div>
      ) : (
        <Card className="bg-muted/10 border-dashed border-border py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Ban className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-medium text-foreground">{config.label} Inactive</h3>
              <p className="text-sm text-muted-foreground mt-2">No valid data recorded during this session.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const ChatTranscript = ({ messages }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!messages || messages.length === 0) {
    return null; // Don't show anything if there's no chat
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="bg-card border-border shadow-sm flex flex-col transition-all duration-300 overflow-hidden">
        <CardHeader 
          className="cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Conversation Log</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full">
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {isOpen && (
          <>
            <div className="h-px bg-border/50 w-full" />
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
              {messages.map((msg, idx) => {
                // Exclude system prompts from UI if any were saved
                if (msg.role === "system") return null;
                
                const isUser = msg.role === "user";
                return (
                  <div key={idx} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isUser 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted text-foreground border border-border/50 rounded-tl-sm"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

const SessionHeader = ({ onExport, isExportOpen, setExportOpen, exportRef, onNavigate, backLabel }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Session Analysis</h1>
      <p className="text-muted-foreground mt-1">Comprehensive breakdown of physiological stress markers.</p>
    </div>
    <div className="flex gap-2 items-center">
      <div className="relative" ref={exportRef}>
        <Button variant="outline" onClick={() => setExportOpen(!isExportOpen)} className="gap-2 w-[140px] justify-between">
          <span>Export</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
        {isExportOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <button onClick={onExport} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors">
              <FileJson className="h-4 w-4 text-blue-500" /><span>Download JSON</span>
            </button>
            <div className="h-[1px] bg-border w-full" />
            <button onClick={() => window.print()} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors">
              <FileText className="h-4 w-4 text-red-500" /><span>Print / Save PDF</span>
            </button>
          </div>
        )}
      </div>
      <Button onClick={onNavigate} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> {backLabel}
      </Button>
    </div>
  </div>
);

const SessionSummary = ({ stats, optStats, thmStats }) => (
  <Card className="bg-muted/30 border-border">
    <CardContent className="px-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Total Duration</p>
            <h3 className="text-2xl font-bold tracking-tight whitespace-nowrap">{stats.duration}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Session Date</p>
            <h3 className="text-lg font-semibold tracking-tight whitespace-nowrap">{stats.date}</h3>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Active Sensors</p>
            <div className="flex flex-wrap gap-2">
              {optStats.hasData && <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${CHART_CONFIG.optical.badge}`}>Optical</span>}
              {thmStats.hasData && <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${CHART_CONFIG.thermal.badge}`}>Thermal</span>}
              {!optStats.hasData && !thmStats.hasData && <span className="text-xs text-muted-foreground italic">No data recorded</span>}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ReportPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const exportMenuRef = useRef(null);
  
  const [rawData, setRawData] = useState({ optical: [], thermal: [], messages: [], created_at: null });
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (sessionId) {
        // Historical Session Mode
        try {
          const response = await api.get(API_ENDPOINTS.SESSION_DETAILS(sessionId));
          setRawData(response.data);
        } catch (error) {
          console.error("Failed to fetch session details:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Recent Session Mode
        const storedData = sessionStorage.getItem("lastSessionData");
        if (storedData) {
          try {
            const parsed = JSON.parse(storedData);
            setRawData({
              optical: Array.isArray(parsed.optical) ? parsed.optical : [],
              thermal: Array.isArray(parsed.thermal) ? parsed.thermal : [],
              messages: [],
              created_at: null
            });
          } catch (e) {
            console.error("Failed to parse session data", e);
          }
        }
        setLoading(false);
      }
    };
    fetchData();
  }, [sessionId]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { stats, opticalStats, thermalStats } = useMemo(() => {
    const optical = rawData.optical || [];
    const thermal = rawData.thermal || [];
    return {
      stats: calculateDuration(optical, thermal, rawData.created_at),
      opticalStats: calculateStats(optical, 'optical'),
      thermalStats: calculateStats(thermal, 'thermal')
    };
  }, [rawData]);

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(rawData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `session-report-${sessionId ? sessionId.substring(0,8) : new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setIsExportOpen(false);
  };

  const backPath = sessionId ? "/history" : "/dashboard";
  const backLabel = sessionId ? "Back to History" : "Back to Dashboard";

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] space-y-4">
        <Spinner className="h-10 w-10 text-primary opacity-80" />
        <p className="text-muted-foreground animate-pulse">Loading session details...</p>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 md:p-8 container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500 pb-20">
      <SessionHeader onExport={handleDownloadJSON} isExportOpen={isExportOpen} setExportOpen={setIsExportOpen} exportRef={exportMenuRef} onNavigate={() => navigate(backPath)} backLabel={backLabel} />
      <SessionSummary stats={stats} optStats={opticalStats} thmStats={thermalStats} />
      
      <Separator />
      
      {/* 
        Using the original stacked layout that you prefer! 
        Optical first, Thermal second, taking full width.
      */}
      <AnalysisSection type="optical" data={rawData.optical} stats={opticalStats} />
      <AnalysisSection type="thermal" data={rawData.thermal} stats={thermalStats} />
      
      {/* Collapsible chat at the very bottom */}
      {rawData.messages && rawData.messages.length > 0 && (
        <ChatTranscript messages={rawData.messages} />
      )}
    </main>
  );
}
