import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Moon, Timer } from "lucide-react";
import { useSessionStore } from "@/store/useSessionStore";

export function StatsGrid({ isFetchingStats }) {
  const sessionStats = useSessionStore((state) => state.sessionStats);

  // Fallbacks for unhydrated data
  const status = sessionStats?.status || "Medium";
  const avgStress = sessionStats?.avg_stress || 45;
  const totalSessions = sessionStats?.total_sessions || 0;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* CARD 1: STRESS (Destructive/Red Theme) */}
      <Card className="rounded-xl border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Current Stress</CardTitle>
          <Heart className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {isFetchingStats ? "..." : status}
          </div>
          <Progress value={avgStress} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {isFetchingStats ? "Loading..." : `Based on ${totalSessions} tracked sessions`}
          </p>
        </CardContent>
      </Card>

      {/* CARD 2: SLEEP (Chart-1/Blue Theme) */}
      <Card className="rounded-xl border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Avg Sleep</CardTitle>
          {/* Using chart-1 for distinct data visualization color */}
          <Moon className="h-4 w-4 text-chart-1" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">6.5 Hours</div>
          <p className="text-xs mt-2 text-destructive font-medium">1.5h less than your goal</p>
        </CardContent>
      </Card>

      {/* CARD 3: MINDFULNESS (Chart-2/Teal Theme) */}
      <Card className="rounded-xl border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-foreground">Daily Mindfulness</CardTitle>
          {/* Using chart-2 for distinct data visualization color */}
          <Timer className="h-4 w-4 text-chart-2" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">12 / 20m</div>
          <Progress value={60} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">8 minutes remaining for today</p>
        </CardContent>
      </Card>
    </div>
  );
}