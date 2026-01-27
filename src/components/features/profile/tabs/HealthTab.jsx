import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export function HealthTab({ form }) {
  const conditionsList = ["anxiety", "depression", "hypertension", "thyroid", "migraine", "insomnia"];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: BIOMETRICS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Biometrics</h3>
          <p className="text-sm text-muted-foreground">Physical health metrics.</p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-3 items-end">
          <FormField control={form.control} name="biometric.height_cm" render={({ field }) => (
            <FormItem>
              <FormLabel>Height (cm)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="biometric.weight_kg" render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="biometric.glasses" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm h-10 mt-auto">
              <FormLabel className="text-sm font-medium mb-0 mr-2 cursor-pointer">Glasses</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )} />
        </div>
      </div>

      <Separator />

      {/* SECTION: MEDICAL HISTORY (Checkboxes) */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Medical History</h3>
          <p className="text-sm text-muted-foreground">Select all conditions that apply to you.</p>
        </div>
        
        <FormField control={form.control} name="health_background.known_conditions" render={({ field }) => (
          <FormItem>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {conditionsList.map((condition) => (
                <FormField
                  key={condition}
                  control={form.control}
                  name="health_background.known_conditions"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={condition}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(condition)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, condition])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== condition
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal capitalize cursor-pointer">
                          {condition}
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )} />
      </div>
    </div>
  );
}