import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Heart, Moon, Timer } from "lucide-react";

export function StatsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Stress</CardTitle>
          <Heart className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Medium</div>
          <Progress value={45} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">Based on your latest check-in</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Sleep</CardTitle>
          <Moon className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">6.5 Hours</div>
          <p className="text-xs text-muted-foreground mt-2 text-orange-500">1.5h less than your goal</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Mindfulness</CardTitle>
          <Timer className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">12 / 20m</div>
          <Progress value={60} className="mt-3 h-2" />
          <p className="text-xs text-muted-foreground mt-2">8 minutes remaining for today</p>
        </CardContent>
      </Card>
    </div>
  );
}