import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { profileSchema } from "@/lib/schemas/profile";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import broken-down components
import { GeneralInfoTab } from "./tabs/GeneralInfoTab";
import { HealthTab } from "./tabs/HealthTab";
import { LifestyleTab } from "./tabs/LifestyleTab";
import { PsychologyTab } from "./tabs/PsychologyTab";

export function ProfileForm() {
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Form
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      identity: { gender: "prefer_not_to_say", country: "", full_name: "" },
      demographics: { work_schedule: "day" },
      biometric: { glasses: false, height_cm: 0, weight_kg: 0 },
      health_background: { known_conditions: [], current_medications: "" },
      lifestyle: { common_stress_domains: [], physical_activity_level: "medium" },
      psychological_traits: {
        personality_scale: { 
          openness: [50], conscientiousness: [50], extraversion: [50], 
          agreeableness: [50], neuroticism: [50] 
        }
      },
    },
  });

  function onSubmit(data) {
    setIsSaving(true);
    console.log("Saving:", data);
    setTimeout(() => setIsSaving(false), 1500);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Sticky Header with Glassmorphism */}
        {/* UPDATED: Added border-border explicitly */}
        <div className="sticky top-[64px] z-30 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">
              Update your personal and medical information.
            </p>
          </div>
          <Button 
            type="submit" 
            disabled={isSaving} 
            // UPDATED: rounded-md to match other forms
            className="min-w-[120px] cursor-pointer rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="general" className="w-full">
          {/* UPDATED: rounded-md for the container and h-12 for better touch targets */}
          <TabsList className="grid w-full grid-cols-4 mb-8 rounded-md bg-muted h-12 p-1">
            {/* UPDATED: rounded-lg for the inner triggers */}
            <TabsTrigger value="general" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">General</TabsTrigger>
            <TabsTrigger value="health" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Health</TabsTrigger>
            <TabsTrigger value="lifestyle" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Lifestyle</TabsTrigger>
            <TabsTrigger value="psych" className="rounded-md data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Psychology</TabsTrigger>
          </TabsList>

          {/* Tab Contents - Passing 'form' context automatically via <Form> wrapper */}
          <div className="space-y-6">
            <TabsContent value="general">
              <GeneralInfoTab form={form} />
            </TabsContent>
            
            <TabsContent value="health">
              <HealthTab form={form} />
            </TabsContent>
            
            <TabsContent value="lifestyle">
              <LifestyleTab form={form} />
            </TabsContent>
            
            <TabsContent value="psych">
              <PsychologyTab form={form} />
            </TabsContent>
          </div>
        </Tabs>
      </form>
    </Form>
  );
}