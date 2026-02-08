import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ArrowLeft, Activity, AlertTriangle, Clock, Thermometer, ChevronDown, FileJson, FileText, Eye, Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- Configuration ---
// Recharts requires specific hex values for stroke/fill, 
// these match Tailwind's blue-500 and orange-500.
const CHART_CONFIG = {
  optical: {
    stroke: "#3b82f6", 
    fillStart: "#3b82f6",
    gradientId: "colorOptical"
  },
  thermal: {
    stroke: "#f97316", 
    fillStart: "#f97316",
    gradientId: "colorThermal"
  }
};

// --- Reusable Stat Card Component ---
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, alertCondition = false }) => (
  <Card className="bg-card border-border shadow-sm">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

export default function SessionReportPage() {
  const navigate = useNavigate();
  const exportMenuRef = useRef(null);

  // --- State ---
  const [rawData, setRawData] = useState({ optical: [], thermal: [] });
  const [isExportOpen, setIsExportOpen] = useState(false);

  // --- 1. Load Data ---
  useEffect(() => {
    const storedData = sessionStorage.getItem("lastSessionData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        // Ensure robust fallback if keys are missing
        const opt = Array.isArray(parsed.optical) ? parsed.optical : [];
        const thm = Array.isArray(parsed.thermal) ? parsed.thermal : [];
        setRawData({ optical: opt, thermal: thm });
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2. Data Processing & Statistics ---
  const { processedOptical, processedThermal, stats } = useMemo(() => {
    const optical = rawData.optical || [];
    const thermal = rawData.thermal || [];

    // Helper: Calculate Avg/Peak
    // isProb: If true, input is 0.0-1.0, convert to 0-100 for display
    const getStats = (data, valueKey, isProb = false) => {
      if (!data.length) return { avg: 0, peak: 0, hasData: false };
      
      const values = data.map(d => {
        const val = d[valueKey] || 0;
        return isProb ? val * 100 : val;
      });

      const sum = values.reduce((a, b) => a + b, 0);
      return {
        avg: Math.round(sum / values.length),
        peak: Math.round(Math.max(...values)),
        hasData: true
      };
    };

    // Optical uses 'score' (0-100)
    const optStats = getStats(optical, 'score', false);
    
    // Thermal uses 'prob' (0.0-1.0) -> Converted to % for Stats UI
    const thmStats = getStats(thermal, 'prob', true); 

    // Calculate Duration
    const combinedTimestamps = [
      ...optical.map(d => d.timestamp),
      ...thermal.map(d => d.timestamp)
    ].sort((a, b) => a - b);

    let durationStr = "00s";
    let dateStr = new Date().toLocaleDateString();

    if (combinedTimestamps.length > 0) {
      const start = combinedTimestamps[0];
      const end = combinedTimestamps[combinedTimestamps.length - 1];
      const diffMs = end - start;
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
      dateStr = new Date(start).toLocaleDateString(undefined, { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
      });
    }

    return {
      processedOptical: optical,
      processedThermal: thermal,
      stats: {
        optical: optStats,
        thermal: thmStats,
        duration: durationStr,
        date: dateStr
      }
    };
  }, [rawData]);

  // --- 3. Formatters & Handlers ---
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" });
  };

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify({ optical: processedOptical, thermal: processedThermal }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `session-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setIsExportOpen(false);
  };

  return (
    <main className="flex-1 p-4 md:p-8 container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Session Analysis</h1>
          <p className="text-muted-foreground mt-1">Comprehensive breakdown of physiological stress markers.</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative" ref={exportMenuRef}>
            <Button variant="outline" onClick={() => setIsExportOpen(!isExportOpen)} className="gap-2 w-[140px] justify-between">
              <span>Export</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button onClick={handleDownloadJSON} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors">
                  <FileJson className="h-4 w-4 text-blue-500" /><span>Download JSON</span>
                </button>
                <div className="h-[1px] bg-border w-full" />
                <button onClick={() => window.print()} className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors">
                  <FileText className="h-4 w-4 text-red-500" /><span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>
          <Button onClick={() => navigate("/chat")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* --- SECTION 1: SESSION SUMMARY --- */}
      <Card className="bg-muted/30 border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-background rounded-full border border-border">
                 <Clock className="h-6 w-6 text-green-500" />
               </div>
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Total Duration</p>
                 <h3 className="text-2xl font-bold">{stats.duration}</h3>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-background rounded-full border border-border">
                 <Calendar className="h-6 w-6 text-purple-500" />
               </div>
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Session Date</p>
                 <h3 className="text-lg font-semibold">{stats.date}</h3>
               </div>
            </div>
            <div className="flex items-center gap-4">
               <div className="p-3 bg-background rounded-full border border-border">
                 <Activity className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <p className="text-sm font-medium text-muted-foreground">Active Sensors</p>
                 <div className="flex gap-2 mt-1">
                   {stats.optical.hasData && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium dark:bg-blue-900/30 dark:text-blue-400">Optical</span>}
                   {stats.thermal.hasData && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-medium dark:bg-orange-900/30 dark:text-orange-400">Thermal</span>}
                   {!stats.optical.hasData && !stats.thermal.hasData && <span className="text-xs text-muted-foreground">No data recorded</span>}
                 </div>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* --- SECTION 2: OPTICAL ANALYSIS --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Eye className="h-5 w-5 text-blue-500" />
           <h2 className="text-xl font-semibold">Optical Camera Analysis</h2>
        </div>

        {/* Optical Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard 
            title="Average Optical Stress" 
            value={`${stats.optical.avg}%`} 
            subtext="Baseline score for this session"
            icon={Activity}
            colorClass="text-blue-500"
          />
          <StatCard 
            title="Peak Optical Stress" 
            value={`${stats.optical.peak}%`} 
            subtext="Highest recorded intensity"
            icon={AlertTriangle}
            colorClass={stats.optical.peak > 70 ? "text-red-500" : "text-yellow-500"}
            alertCondition={stats.optical.peak > 70}
          />
        </div>

        {/* Optical Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Stress Timeline (Optical)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pl-0">
            {stats.optical.hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedOptical} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id={CHART_CONFIG.optical.gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_CONFIG.optical.fillStart} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CHART_CONFIG.optical.fillStart} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="timestamp" stroke="currentColor" className="text-muted-foreground opacity-50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatTime} minTickGap={50} />
                  <YAxis stroke="currentColor" className="text-muted-foreground opacity-50" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" vertical={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))", borderRadius: "var(--radius)" }} 
                    labelFormatter={formatTime} 
                    formatter={(value) => [`${value}%`, "Stress Level"]} 
                  />
                  <ReferenceLine y={50} className="stroke-muted-foreground" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="score" stroke={CHART_CONFIG.optical.stroke} strokeWidth={2} fillOpacity={1} fill={`url(#${CHART_CONFIG.optical.gradientId})`} animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md m-4">
                <p>Optical camera was inactive during this session.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 3: THERMAL ANALYSIS --- */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Thermal Camera Analysis</h2>
        </div>

        {stats.thermal.hasData ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                
                {/* Thermal Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <StatCard 
                        title="Average Thermal Stress" 
                        value={`${stats.thermal.avg}%`} 
                        subtext="Average probability score"
                        icon={Activity}
                        colorClass="text-orange-500"
                   />
                   <StatCard 
                        title="Peak Thermal Stress" 
                        value={`${stats.thermal.peak}%`} 
                        subtext="Highest recorded probability"
                        icon={AlertTriangle}
                        colorClass={stats.thermal.peak > 70 ? "text-red-500" : "text-yellow-500"}
                        alertCondition={stats.thermal.peak > 70}
                   />
                </div>

                {/* Thermal Chart */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">
                            Thermal Timeline 
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={processedThermal} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={CHART_CONFIG.thermal.gradientId} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CHART_CONFIG.thermal.fillStart} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CHART_CONFIG.thermal.fillStart} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="timestamp" stroke="currentColor" className="text-muted-foreground opacity-50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatTime} minTickGap={50} />
                                {/* Display Probabilities (0-1) as Percentages (0-100) on Axis */}
                                <YAxis stroke="currentColor" className="text-muted-foreground opacity-50" fontSize={12} tickLine={false} axisLine={false} domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" vertical={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))", borderRadius: "var(--radius)" }} 
                                    labelFormatter={formatTime} 
                                    formatter={(value) => [`${(value * 100).toFixed(1)}%`, "Stress Prob"]} 
                                />
                                <Area type="monotone" dataKey="prob" stroke={CHART_CONFIG.thermal.stroke} strokeWidth={2} fillOpacity={1} fill={`url(#${CHART_CONFIG.thermal.gradientId})`} animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
            <Card className="bg-muted/10 border-dashed border-border py-12">
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-medium text-foreground">Thermal Camera Inactive</h3>
                        <p className="text-sm text-muted-foreground mt-2">No thermal data was recorded during this session.</p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </main>
  );
}