import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, Moon, Sun, Monitor } from "lucide-react";

import { settingsSchema } from "@/lib/schemas/settings";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";

export function SettingsForm() {
  const [isSaving, setIsSaving] = useState(false);
  const { setTheme } = useTheme();

  const form = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      appearance: { theme_mode: "system" },
      conversational_preferences: {
        preferred_name_in_chat: "Preeth",
        tone: "supportive",
        response_length: "medium",
        feedback_style: "gentle",
        topics_to_avoid: [],
      },
      privacy_and_consent: {
        enable_facial_analysis: true,
        enable_thermal_imaging: false,
        allow_biometric_storage: true,
        allow_model_training_use: false,
        allow_long_term_tracking: true,
      },
      data_retention: {
        retention_policy: "indefinite",
        retention_days: 30,
        auto_delete_enabled: false,
      },
      regional: {
        timezone: "Asia/Kolkata",
        date_format: "DD-MM-YYYY",
        time_format: "12h",
        language: "en",
      },
    },
  });

  const handleThemeChange = (value) => {
    form.setValue("appearance.theme_mode", value);
    setTheme(value);
  };

  function onSubmit(data) {
    setIsSaving(true);
    console.log("Saving Settings:", data);
    setTimeout(() => setIsSaving(false), 1000);
  }

  const sensitiveTopics = ["health", "family", "career", "personal", "financial"];
  const privacyToggles = [
    { name: "privacy_and_consent.enable_facial_analysis", label: "Facial Stress Analysis", desc: "Allow camera access to detect stress markers." },
    { name: "privacy_and_consent.enable_thermal_imaging", label: "Thermal Imaging", desc: "Allow thermal camera data for temperature detection." },
    { name: "privacy_and_consent.allow_biometric_storage", label: "Store Biometric Data", desc: "Save analysis history locally." },
    { name: "privacy_and_consent.allow_model_training_use", label: "Improve AI Model", desc: "Allow anonymous data usage to improve accuracy." },
    { name: "privacy_and_consent.allow_long_term_tracking", label: "Long-term Tracking", desc: "Keep historical data beyond 30 days." }
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 pb-16 w-full">
        
        {/* === STICKY HEADER === */}
        {/* Matches ProfileForm: -mx-4 to stretch full width, backdrop blur for glass effect */}
        <div className="sticky top-[64px] z-30 -mx-4 px-4 py-4 bg-background/80 backdrop-blur-md border-b flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Manage preferences and privacy controls.</p>
          </div>
          <Button type="submit" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>

        {/* === SECTION 1: APPEARANCE === */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Interface Theme</h3>
            <p className="text-sm text-muted-foreground">Select your preferred color scheme.</p>
          </div>
          <FormField
            control={form.control}
            name="appearance.theme_mode"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormControl>
                  <RadioGroup
                    onValueChange={handleThemeChange}
                    defaultValue={field.value}
                    // Fixed: Tighter grid (gap-2) and consistent columns
                    className="grid grid-cols-3 gap-2"
                  >
                    {[
                      { value: "light", icon: Sun, label: "Light" },
                      { value: "dark", icon: Moon, label: "Dark" },
                      { value: "system", icon: Monitor, label: "System" },
                    ].map((theme) => (
                      <FormItem key={theme.value}>
                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary [&:has([data-state=checked])>div]:bg-accent cursor-pointer">
                          <FormControl><RadioGroupItem value={theme.value} className="sr-only" /></FormControl>
                          <div className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground transition-all h-24 w-full">
                            <theme.icon className="h-6 w-6 mb-2" />
                            <span className="font-medium text-sm">{theme.label}</span>
                          </div>
                        </FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <Separator className="my-6" />

        {/* === SECTION 2: CHAT PREFERENCES === */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Chat Experience</h3>
            <p className="text-sm text-muted-foreground">Customize how the AI talks to you.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <FormField control={form.control} name="conversational_preferences.preferred_name_in_chat" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Name</FormLabel>
                <FormControl><Input placeholder="Preeth" {...field} className="w-full" /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="conversational_preferences.tone" render={({ field }) => (
              <FormItem>
                <FormLabel>Tone Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="formal">Formal & Objective</SelectItem>
                    <SelectItem value="friendly">Friendly & Casual</SelectItem>
                    <SelectItem value="supportive">Empathetic & Supportive</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            
             <FormField control={form.control} name="conversational_preferences.response_length" render={({ field }) => (
              <FormItem>
                <FormLabel>Response Length</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="short">Short</SelectItem>
                    <SelectItem value="medium">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

             <FormField control={form.control} name="conversational_preferences.feedback_style" render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback Style</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="gentle">Gentle</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          {/* Topics to Avoid */}
          <FormField control={form.control} name="conversational_preferences.topics_to_avoid" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Sensitive Topics (Avoid)</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                {sensitiveTopics.map((item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="conversational_preferences.topics_to_avoid"
                    render={({ field }) => {
                      return (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(field.value?.filter((value) => value !== item))
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize cursor-pointer">{item}</FormLabel>
                        </FormItem>
                      )
                    }}
                  />
                ))}
              </div>
            </FormItem>
          )} />
        </div>

        <Separator className="my-6" />

        {/* === SECTION 3: PRIVACY & CONSENT === */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Privacy Controls</h3>
            <p className="text-sm text-muted-foreground">Manage data permissions.</p>
          </div>
          <div className="space-y-4">
            {privacyToggles.map((item) => (
              <FormField
                key={item.name}
                control={form.control}
                name={item.name}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-medium">{item.label}</FormLabel>
                      <FormDescription className="text-xs sm:text-sm">{item.desc}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Separator className="my-6" />

        {/* === SECTION 4: DATA & REGIONAL === */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Data & Regional</h3>
            <p className="text-sm text-muted-foreground">Set your time and date preferences.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
             <FormField control={form.control} name="regional.timezone" render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    <SelectItem value="America/New_York">New York (EST)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />

             <FormField control={form.control} name="data_retention.retention_policy" render={({ field }) => (
              <FormItem>
                <FormLabel>Data Retention Policy</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="session_only">Session Only</SelectItem>
                    <SelectItem value="days">Specific Days</SelectItem>
                    <SelectItem value="indefinite">Indefinite</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            
             <FormField control={form.control} name="data_retention.retention_days" render={({ field }) => (
              <FormItem>
                <FormLabel>Retention Period (Days)</FormLabel>
                <FormControl><Input type="number" {...field} disabled={form.watch("data_retention.retention_policy") !== "days"} className="w-full" /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="regional.language" render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

           <FormField control={form.control} name="data_retention.auto_delete_enabled" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">Auto-Delete Old Data</FormLabel>
                  <FormDescription className="text-xs sm:text-sm">Permanently remove data past retention period.</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
          )} />
        </div>

      </form>
    </Form>
  );
}