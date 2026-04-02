import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

import { profileSchema } from "@/lib/schemas/profile";
import { mapBackendToFrontend, mapFrontendToBackend } from "@/lib/utils/profileMapper";
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
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  // Initialize Form
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: mapBackendToFrontend(user) // Use mapper for safe defaults
  });

  // Pull existing user data into the UI form reactively when the backend payload hydrates
  useEffect(() => {
    if (user) {
      form.reset(mapBackendToFrontend(user));
    }
  }, [user, form]);

  async function onSubmit(data) {
    setIsSaving(true);
    
    // Abstract the structural mapping to external logic layer
    const requestBody = mapFrontendToBackend(data);

    try {
      await updateProfile(requestBody);
      toast.success("Profile saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error(useAuthStore.getState().error || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
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