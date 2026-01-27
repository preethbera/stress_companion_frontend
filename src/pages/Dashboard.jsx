import React from "react";
import { StatsGrid } from "@/components/layout/StatsGrid";
import { Button } from "@/components/ui/button";
import { MessageCircle, Zap, Brain, Wind } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    // Added py-6 and space-y-10 for vertical breathing room
    <div className="py-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* === HEADER SECTION === */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Good Morning, Preeth</h1>
          <p className="text-muted-foreground text-lg">
            How are you feeling today?
          </p>
        </div>
        
        {/* Main CTA: Prominent and Rounded */}
        <Button asChild size="lg" className="rounded-full shadow-lg h-12 px-8">
          <Link to="/chat">
            <MessageCircle className="mr-2 h-5 w-5" />
            Start Session
          </Link>
        </Button>
      </div>

      {/* === STATS SECTION === */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Current Overview
        </h2>
        <StatsGrid />
      </div>

      {/* === QUICK ACTIONS GRID === */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Recommended for you
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Card 1: Breathing */}
          <div className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start text-left">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Wind className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg">Guided Breathing</h3>
            <p className="text-sm text-muted-foreground">
              A 2-minute rhythm to settle your heart rate.
            </p>
          </div>

          {/* Card 2: Stress Journal */}
          <div className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start text-left">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-lg">Thought Dump</h3>
            <p className="text-sm text-muted-foreground">
              Write down what's bothering you to clear your head.
            </p>
          </div>

          {/* Card 3: Quick Relief */}
          <div className="p-6 rounded-xl border bg-card hover:bg-accent/50 hover:shadow-sm transition-all cursor-pointer group flex flex-col items-start text-left">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="font-bold text-lg">Quick Relief</h3>
            <p className="text-sm text-muted-foreground">
              Instant grounding techniques for acute stress.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}