import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";

export function PsychologyTab({ form }) {
  const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];

  return (
    // UPDATED: Added rounded-md, border color, and animation
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-md border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Personality Scale (Big 5)</CardTitle>
        <CardDescription className="text-muted-foreground">
          Rate your personality traits from 0 (Low) to 100 (High).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {traits.map((trait) => (
          <FormField
            key={trait}
            control={form.control}
            name={`psychological_traits.personality_scale.${trait}`}
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel className="capitalize font-medium text-base text-foreground">
                    {trait}
                  </FormLabel>
                  {/* UPDATED: rounded-lg to match the soft aesthetic of the app */}
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                    {field.value[0]}%
                  </span>
                </div>
                <FormControl>
                  <Slider
                    min={0}
                    max={100}
                    step={1}
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    className="py-2"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        ))}
      </CardContent>
    </Card>
  );
}