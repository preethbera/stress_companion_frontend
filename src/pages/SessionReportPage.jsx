import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import {
  ArrowLeft, Activity, AlertTriangle, Clock, Thermometer, ChevronDown, FileJson, FileText, Eye, Calendar, Ban
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- Configuration ---
const CHART_CONFIG = {
  optical: {
    label: "Optical Camera",
    dataKey: "score",
    // UI Classes
    icon: Eye,
    colorClass: "text-blue-500",
    // Graph Props
    stroke: "#3b82f6", 
    fillStart: "#3b82f6",
    gradientId: "colorOptical",
    domain: [0, 100],
    formatter: (val) => val,
    // Tag Styles: Subtle border and background
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20" 
  },
  thermal: {
    label: "Thermal Camera",
    dataKey: "prob",
    // UI Classes
    icon: Thermometer,
    colorClass: "text-orange-500",
    // Graph Props
    stroke: "#f97316", 
    fillStart: "#f97316",
    gradientId: "colorThermal",
    domain: [0, 1],
    formatter: (val) => val * 100,
    // Tag Styles: Subtle border and background
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/20"
  }
};

// --- Helper Functions ---
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], { hour12: false, minute: "2-digit", second: "2-digit" });
};

const calculateStats = (data, type) => {
  const config = CHART_CONFIG[type];
  if (!data || !data.length) return { avg: 0, peak: 0, hasData: false };

  const values = data.map(d => {
    const raw = d[config.dataKey] || 0;
    return type === 'thermal' ? raw * 100 : raw;
  });

  const sum = values.reduce((a, b) => a + b, 0);
  return {
    avg: Math.round(sum / values.length),
    peak: Math.round(Math.max(...values)),
    hasData: true
  };
};

const calculateDuration = (optical, thermal) => {
  const combinedTimestamps = [...optical, ...thermal].map(d => d.timestamp).sort((a, b) => a - b);
  
  if (combinedTimestamps.length === 0) {
    return { duration: "0s", date: new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) };
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

// 1. Stat Card
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

// 2. Chart Component
const StressChart = ({ data, config }) => (
  <Card className="bg-card border-border">
    <CardHeader>
      <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">
        Timeline ({config.label})
      </CardTitle>
    </CardHeader>
    <CardContent className="h-[300px] w-full pl-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config.fillStart} stopOpacity={0.3} />
              <stop offset="95%" stopColor={config.fillStart} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="timestamp" 
            stroke="currentColor" 
            className="text-muted-foreground opacity-50" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={formatTime} 
            minTickGap={50} 
          />
          <YAxis 
            stroke="currentColor" 
            className="text-muted-foreground opacity-50" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            domain={config.domain} 
            tickFormatter={(val) => `${config.formatter(val).toFixed(0)}%`} 
          />
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted opacity-30" vertical={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--popover))", 
              borderColor: "hsl(var(--border))", 
              color: "hsl(var(--popover-foreground))", 
              borderRadius: "var(--radius)" 
            }}
            labelFormatter={formatTime}
            formatter={(value) => [`${config.formatter(value).toFixed(1)}%`, "Stress Level"]}
          />
          <ReferenceLine y={config.domain[1] === 1 ? 0.5 : 50} className="stroke-muted-foreground" strokeDasharray="3 3" />
          <Area 
            type="monotone" 
            dataKey={config.dataKey} 
            stroke={config.stroke} 
            strokeWidth={2} 
            fillOpacity={1} 
            fill={`url(#${config.gradientId})`} 
            animationDuration={1500} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

// 3. Analysis Section Wrapper
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
            <StatCard
              title={`Average ${config.label} Stress`}
              value={`${stats.avg}%`}
              subtext="Baseline score for this session"
              icon={Activity}
              colorClass={config.colorClass}
            />
            <StatCard
              title={`Peak ${config.label} Stress`}
              value={`${stats.peak}%`}
              subtext="Highest recorded intensity"
              icon={AlertTriangle}
              colorClass={stats.peak > 70 ? "text-destructive" : "text-yellow-500"}
              alertCondition={stats.peak > 70}
            />
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
              <p className="text-sm text-muted-foreground mt-2">No data recorded during this session.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// 4. Header Component
const SessionHeader = ({ onExport, isExportOpen, setExportOpen, exportRef, onNavigate }) => (
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
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>
    </div>
  </div>
);

// 5. Session Summary (Updated with Flexbox)
const SessionSummary = ({ stats, optStats, thmStats }) => (
  <Card className="bg-muted/30 border-border">
    <CardContent className="px-8">
      <div className="flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
        
        {/* Item 1: Duration */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Total Duration</p>
            <h3 className="text-2xl font-bold tracking-tight whitespace-nowrap">{stats.duration}</h3>
          </div>
        </div>

        {/* Item 2: Date */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Session Date</p>
            <h3 className="text-lg font-semibold tracking-tight whitespace-nowrap">{stats.date}</h3>
          </div>
        </div>

        {/* Item 3: Sensors */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium leading-none text-muted-foreground">Active Sensors</p>
            <div className="flex flex-wrap gap-2">
              {optStats.hasData && (
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${CHART_CONFIG.optical.badge}`}>
                  Optical
                </span>
              )}
              {thmStats.hasData && (
                <span className={`text-xs px-2.5 py-0.5 rounded-md font-medium border ${CHART_CONFIG.thermal.badge}`}>
                  Thermal
                </span>
              )}
              {!optStats.hasData && !thmStats.hasData && (
                <span className="text-xs text-muted-foreground italic">No data recorded</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </CardContent>
  </Card>
);

// --- Main Page Component ---

export default function SessionReportPage() {
  const navigate = useNavigate();
  const exportMenuRef = useRef(null);
  const [rawData, setRawData] = useState({ optical: [], thermal: [] });
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Load Data
  useEffect(() => {
    const storedData = sessionStorage.getItem("lastSessionData");
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setRawData({
          optical: Array.isArray(parsed.optical) ? parsed.optical : [],
          thermal: Array.isArray(parsed.thermal) ? parsed.thermal : []
        });
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Process Stats
  const { stats, opticalStats, thermalStats } = useMemo(() => {
    const optical = rawData.optical || [];
    const thermal = rawData.thermal || [];

    return {
      stats: calculateDuration(optical, thermal),
      opticalStats: calculateStats(optical, 'optical'),
      thermalStats: calculateStats(thermal, 'thermal')
    };
  }, [rawData]);

  const handleDownloadJSON = () => {
    const jsonString = JSON.stringify(rawData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `session-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setIsExportOpen(false);
  };

  return (
    <main className="flex-1 p-4 md:p-8 container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      <SessionHeader 
        onExport={handleDownloadJSON} 
        isExportOpen={isExportOpen} 
        setExportOpen={setIsExportOpen} 
        exportRef={exportMenuRef}
        onNavigate={() => navigate("/chat")}
      />

      <SessionSummary 
        stats={stats} 
        optStats={opticalStats} 
        thmStats={thermalStats} 
      />

      <Separator />

      <AnalysisSection 
        type="optical" 
        data={rawData.optical} 
        stats={opticalStats} 
      />

      <AnalysisSection 
        type="thermal" 
        data={rawData.thermal} 
        stats={thermalStats} 
      />

    </main>
  );
}