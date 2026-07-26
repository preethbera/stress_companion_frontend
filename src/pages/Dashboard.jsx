import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  MessageCircle, Eye, Thermometer, Mic, ShieldCheck, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/useAuthStore";
import { useSessionStore } from "@/store/useSessionStore";
import { useSessionManager } from "@/hooks/useSessionManager";

const DashboardCard = ({ iconNode, title, description }) => (
  <Card className="bg-card shadow-sm border-border">
    <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
      {iconNode}
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const { fetchDashboardStats, isFetchingStats } = useSessionManager();
  const user = useAuthStore(state => state.user);
  const sessionStats = useSessionStore(state => state.sessionStats);

  useEffect(() => {
    fetchDashboardStats();
  }, [fetchDashboardStats]);

  const totalSessions = sessionStats?.total_sessions || 0;
  const avgStress = sessionStats?.avg_stress || null;
  const status = sessionStats?.status || "Unknown";

  return (
    <div className="flex-1 container max-w-6xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER ROW: Welcome & Stats */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {user?.first_name || user?.username || "User"}
          </h1>
          <p className="text-muted-foreground">
            Welcome to Stress Companion. Your personal space for real-time stress analysis.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="gap-2">
            <Link to="/chat">
              <Mic className="h-4 w-4" />
              Start Session
            </Link>
          </Button>
        </div>
      </div>

      {/* MINIMAL STATS (Only if user has sessions) */}
      {!isFetchingStats && totalSessions > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessions}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-sm md:col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Average Stress Level</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <div className="text-2xl font-bold">{avgStress ? `${avgStress}%` : '--'}</div>
              {status !== "Unknown" && (
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                  status === 'High' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                  status === 'Medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                  'bg-green-500/10 text-green-500 border-green-500/20'
                }`}>
                  {status}
                </span>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* HOW TO USE */}
      <div className="space-y-4 pt-4 border-t border-border/50 mt-8">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
          <p className="text-muted-foreground text-sm">Three simple steps to start tracking your physiological stress.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <DashboardCard
            iconNode={<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">1</div>}
            title="Allow Access"
            description="Ensure you are in a well-lit space. The app uses your webcam strictly locally to analyze subtle physiological changes."
          />
          <DashboardCard
            iconNode={<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">2</div>}
            title="Talk it out"
            description="Vent about your day, stressors, or anything on your mind. Your companion will listen and respond without judgment."
          />
          <DashboardCard
            iconNode={<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">3</div>}
            title="Review Insights"
            description="Once finished, we generate a detailed report showing your exact stress peaks alongside the conversation."
          />
        </div>
      </div>

      {/* CORE FEATURES EXPLAINED */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Core Features</h2>
          <p className="text-muted-foreground text-sm">The technology powering your sessions.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 pb-8">
          <DashboardCard
            iconNode={<Eye className="h-5 w-5 text-blue-500 shrink-0" />}
            title="Optical Analysis"
            description="By analyzing micro-expressions and rPPG (color shifts) in your face, the app detects heart rate and acute stress levels in real-time via webcam."
          />
          <DashboardCard
            iconNode={<Thermometer className="h-5 w-5 text-orange-500 shrink-0" />}
            title="Thermal Imaging"
            description="With a supported thermal camera, the app measures heat signature changes in specific regions of your face which correlate strongly with mental stress."
          />
          <DashboardCard
            iconNode={<MessageCircle className="h-5 w-5 text-purple-500 shrink-0" />}
            title="Conversational Support"
            description="A highly responsive, voice-activated companion acts as a sounding board, processing your speech and guiding you through stressful moments."
          />
        </div>
      </div>

    </div>
  );
}