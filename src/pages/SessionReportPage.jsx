import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ArrowLeft,
  Download,
  Activity,
  AlertTriangle,
  Clock,
  Thermometer,
  ChevronDown,
  FileJson,
  FileText,
  Eye,
  EyeOff
} from "lucide-react";

// Shadcn UI Components (Assuming standard implementation)
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionReportPage() {
  const navigate = useNavigate();
  const [opticalData, setOpticalData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, peak: 0, duration: "00:00" });
  
  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef(null);

  // Thermal State (Simulation)
  const [showThermalDemo, setShowThermalDemo] = useState(false);
  const [thermalData, setThermalData] = useState([]);

  // --- 1. Load Data ---
  useEffect(() => {
    const storedData = sessionStorage.getItem("lastSessionData");

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setOpticalData(parsedData);
          calculateStats(parsedData);
        } else {
          // If data is empty, we handle it gracefully in UI rather than forcing redirect
          // to allow viewing the "Empty" state or Thermal demo.
          console.warn("Session data found but empty.");
        }
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  // Close dropdown if clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- 2. Logic ---

  const calculateStats = (dataset) => {
    if (!dataset || dataset.length === 0) return;
    const sum = dataset.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Math.round(sum / dataset.length);
    const peak = Math.max(...dataset.map((d) => d.score));
    
    const startTime = dataset[0].timestamp;
    const endTime = dataset[dataset.length - 1].timestamp;
    const diffMs = endTime - startTime;
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    setStats({ avg, peak, duration });
  };

  const handleDownloadJSON = () => {
    if (opticalData.length === 0) return;
    const jsonString = JSON.stringify({ optical: opticalData, thermal: thermalData }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `session-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handleExportPDF = () => {
    // Simple robust solution: Trigger browser print dialog (Save as PDF)
    window.print();
    setIsExportOpen(false);
  };

  const generateThermalDemoData = () => {
    // Generate simple sine wave dummy data
    if (opticalData.length === 0) return [];
    return opticalData.map((d) => ({
      timestamp: d.timestamp,
      temp: 36.5 + Math.sin(d.timestamp / 1000) * 0.5 + Math.random() * 0.2
    }));
  };

  useEffect(() => {
    if (showThermalDemo && thermalData.length === 0) {
      setThermalData(generateThermalDemoData());
    }
  }, [showThermalDemo, opticalData]);

  // Helper formatting
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour12: false,
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <main className="flex-1 p-4 md:p-8 container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Session Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive breakdown of physiological stress markers.
          </p>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <Button 
              variant="outline" 
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="gap-2 w-[140px] justify-between"
            >
              <span>Export</span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
            
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-md shadow-md z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={handleDownloadJSON}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors"
                >
                  <FileJson className="h-4 w-4 text-blue-500" />
                  <span>Download JSON</span>
                </button>
                <div className="h-[1px] bg-border w-full" />
                <button 
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm hover:bg-muted text-left transition-colors"
                >
                  <FileText className="h-4 w-4 text-red-500" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            )}
          </div>

          <Button onClick={() => navigate("/chat")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
      </div>

      {/* --- SECTION 1: OPTICAL ANALYSIS --- */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
           <Eye className="h-5 w-5 text-blue-500" />
           <h2 className="text-xl font-semibold">Optical Camera Analysis</h2>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Stress
              </CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.avg}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Baseline for this session
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Peak Level
              </CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${stats.peak > 70 ? "text-red-500" : "text-yellow-500"}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${stats.peak > 70 ? "text-red-500" : "text-foreground"}`}
              >
                {stats.peak}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest recorded intensity
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {stats.duration}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total active monitoring time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Optical Chart */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider">Stress Timeline (Optical)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full pl-0">
            {opticalData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={opticalData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="timestamp"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatTime}
                    minTickGap={50}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      borderColor: "#334155",
                      color: "#f8fafc",
                    }}
                    labelFormatter={formatTime}
                    formatter={(value) => [`${value}%`, "Stress Level"]}
                  />
                  <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No optical data recorded.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- SECTION 2: THERMAL ANALYSIS (New) --- */}
      <div className="space-y-4 pt-8 border-t border-border">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <Thermometer className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">Thermal Camera Analysis</h2>
            </div>
            
            {/* Toggle for Simulation/Demo */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowThermalDemo(!showThermalDemo)}
                className="text-muted-foreground hover:text-foreground text-xs"
            >
                {showThermalDemo ? <EyeOff className="h-3 w-3 mr-2"/> : <Eye className="h-3 w-3 mr-2"/>}
                {showThermalDemo ? "Hide Simulation" : "View Demo Data"}
            </Button>
        </div>

        {showThermalDemo ? (
            /* SIMULATED THERMAL DATA UI */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Card className="bg-card/50 border-border">
                        <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Avg Temperature</CardTitle></CardHeader>
                        <CardContent><div className="text-2xl font-bold text-foreground">36.7°C</div></CardContent>
                    </Card>
                    <Card className="bg-card/50 border-border">
                         <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">ROI Variance</CardTitle></CardHeader>
                         <CardContent><div className="text-2xl font-bold text-foreground">0.4°C</div></CardContent>
                    </Card>
                </div>

                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-sm uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                            Temperature Timeline <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded ml-2">SIMULATED</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={thermalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="timestamp" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatTime} minTickGap={50} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={[35, 38]} tickFormatter={(value) => `${value}°C`} />
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", color: "#f8fafc" }} 
                                    labelFormatter={formatTime} 
                                    formatter={(value) => [`${value.toFixed(1)}°C`, "Avg Temp"]} 
                                />
                                <Area type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorTemp)" animationDuration={1500} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        ) : (
            /* NO DATA STATE (Default) */
            <Card className="bg-card/30 border-dashed border-border py-12">
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                        <Thermometer className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="max-w-md">
                        <h3 className="text-lg font-medium text-foreground">Thermal Camera Inactive</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            No thermal data was recorded during this session. The sensor was either disconnected or disabled.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>

      {/* --- AUTOMATED INSIGHT --- */}
      <Card className="bg-card/50 border-border mt-8">
        <CardHeader>
          <CardTitle className="text-lg">AI Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {stats.avg < 30
              ? "Great job! Your stress levels remained consistently low throughout the session. This indicates a state of relaxation and mental clarity."
              : stats.avg < 60
                ? "You showed moderate variability in stress levels. There were moments of intensity, but you generally returned to baseline quickly. This is a healthy adaptive response."
                : "We detected significant sustained stress during this session. This might be due to the difficulty of the task or external factors. Consider trying a guided breathing exercise."}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}