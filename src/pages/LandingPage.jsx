import React from "react";
import { Link } from "react-router-dom";
import { Eye, Thermometer, MessageCircle, ArrowRight, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const FeatureCard = ({ iconNode, title, description }) => (
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

export default function LandingPage() {
  return (
    <div className="flex-1 container max-w-5xl mx-auto py-12 md:py-20 space-y-16 animate-in fade-in duration-500">
      
      {/* HERO SECTION */}
      <section className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Real-time physiological stress analysis
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground">
          Your personal mental health assistant. Connect your camera, speak freely, and get deep insights into your stress levels
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button asChild size="lg" className="gap-2">
            <Link to="/signup">
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/login">
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          </Button>
        </div>
      </section>

      {/* CORE FEATURES EXPLAINED */}
      <section className="space-y-6 pt-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight">How it works</h2>
          <p className="text-muted-foreground mt-2">The technology powering your sessions</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 pb-8">
          <FeatureCard
            iconNode={<Eye className="h-5 w-5 text-blue-500 shrink-0" />}
            title="Optical Analysis"
            description="By analyzing micro-expressions and rPPG (color shifts) in your face, the app detects heart rate and acute stress levels in real-time via webcam."
          />
          <FeatureCard
            iconNode={<Thermometer className="h-5 w-5 text-orange-500 shrink-0" />}
            title="Thermal Imaging"
            description="With a supported thermal camera, the app measures heat signature changes in specific regions of your face which correlate strongly with mental stress."
          />
          <FeatureCard
            iconNode={<MessageCircle className="h-5 w-5 text-purple-500 shrink-0" />}
            title="Conversational Support"
            description="A highly responsive, voice-activated companion acts as a sounding board, processing your speech and guiding you through stressful moments."
          />
        </div>
      </section>

    </div>
  );
}
