import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Fixed for React Router
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { 
  ArrowLeft, 
  Download, 
  Activity, 
  AlertTriangle, 
  Clock 
} from "lucide-react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar"; 

export default function StressReportPage() {
  const navigate = useNavigate(); // Hook for navigation
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ avg: 0, peak: 0, duration: "00:00" });

  useEffect(() => {
    // 1. Retrieve Data from Session Storage
    const storedData = sessionStorage.getItem("lastSessionData");
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setData(parsedData);
          calculateStats(parsedData);
        } else {
            // Data exists but is empty/invalid
           navigate("/chat"); 
        }
      } catch (e) {
        console.error("Failed to parse session data", e);
        navigate("/chat");
      }
    } else {
      // If no data found (user went directly to URL), redirect back
      navigate("/chat");
    }
  }, [navigate]);

  const calculateStats = (dataset) => {
    if (!dataset || dataset.length === 0) return;

    // Average
    const sum = dataset.reduce((acc, curr) => acc + curr.score, 0);
    const avg = Math.round(sum / dataset.length);

    // Peak
    const peak = Math.max(...dataset.map(d => d.score));

    // Duration (First vs Last timestamp)
    const startTime = dataset[0].timestamp;
    const endTime = dataset[dataset.length - 1].timestamp;
    const diffMs = endTime - startTime;
    
    // Format Duration
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    const duration = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

    setStats({ avg, peak, duration });
  };

  const handleDownload = () => {
    if (data.length === 0) return;
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `stress-session-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for tooltip time formatting
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour12: false, 
      minute: "2-digit", 
      second: "2-digit" 
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Reusing your existing Navbar, passing mock user prop if needed */}
      <Navbar user={{ name: "User" }} onLogout={() => navigate("/")} />

      <main className="flex-1 p-4 md:p-8 container mx-auto max-w-6xl space-y-8 animate-in fade-in duration-500">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Session Analysis</h1>
            <p className="text-muted-foreground mt-1">
              Detailed breakdown of your physiological stress markers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" /> Export JSON
            </Button>
            <Button onClick={() => navigate("/chat")} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Average Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Stress</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.avg}%</div>
              <p className="text-xs text-muted-foreground mt-1">Baseline for this session</p>
            </CardContent>
          </Card>

          {/* Peak Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Peak Level</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.peak > 70 ? 'text-red-500' : 'text-yellow-500'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.peak > 70 ? 'text-red-500' : 'text-foreground'}`}>
                {stats.peak}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Highest recorded intensity</p>
            </CardContent>
          </Card>

          {/* Duration Card */}
          <Card className="bg-card/50 border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.duration}</div>
              <p className="text-xs text-muted-foreground mt-1">Total active monitoring time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Chart Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Stress Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] w-full pl-0">
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    labelFormatter={formatTime}
                    formatter={(value) => [`${value}%`, "Stress Level"]}
                  />
                  
                  <ReferenceLine y={50} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: 'Baseline', fill: '#94a3b8', fontSize: 12 }} />
                  
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
                Processing data...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Automated Insight */}
        <Card className="bg-card/50 border-border">
            <CardHeader>
                <CardTitle className="text-lg">AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                    {stats.avg < 30 ? (
                        "Great job! Your stress levels remained consistently low throughout the session. This indicates a state of relaxation and mental clarity."
                    ) : stats.avg < 60 ? (
                        "You showed moderate variability in stress levels. There were moments of intensity, but you generally returned to baseline quickly. This is a healthy adaptive response."
                    ) : (
                        "We detected significant sustained stress during this session. This might be due to the difficulty of the task or external factors. Consider trying a guided breathing exercise."
                    )}
                </p>
            </CardContent>
        </Card>

      </main>
    </div>
  );
}