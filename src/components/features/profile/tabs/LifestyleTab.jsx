import React from "react";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function LifestyleTab({ form }) {
  const stressDomains = ["work", "academics", "social", "health", "financial", "family"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: HABITS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Daily Habits</h3>
          <p className="text-sm text-muted-foreground">Your routine and activity levels.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="lifestyle.physical_activity_level" render={({ field }) => (
            <FormItem>
              <FormLabel>Physical Activity</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full"> {/* Full Width */}
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="low">Low (Sedentary)</SelectItem>
                  <SelectItem value="medium">Medium (Moderate)</SelectItem>
                  <SelectItem value="high">High (Active)</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />

          <FormField control={form.control} name="lifestyle.daily_screen_time_hours" render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Screen Time (Hours)</FormLabel>
              <FormControl><Input type="number" step="0.5" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>
      </div>

      <Separator />

      {/* SECTION: STRESS DOMAINS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Stress Sources</h3>
          <p className="text-sm text-muted-foreground">Select the primary areas causing stress.</p>
        </div>

        <FormField control={form.control} name="lifestyle.common_stress_domains" render={({ field }) => (
          <FormItem>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {stressDomains.map((item) => (
                <FormField
                  key={item}
                  control={form.control}
                  name="lifestyle.common_stress_domains"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize cursor-pointer">
                          {item}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
          </FormItem>
        )} />
      </div>
    </div>
  );
}