import React from "react";
import { Camera } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export function GeneralInfoTab({ form }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: IDENTITY */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Personal Identity</h3>
            <p className="text-sm text-muted-foreground">Basic information to identify your profile.</p>
          </div>
          {/* USER AVATAR COMPONENT */}
          <div className="relative cursor-pointer group">
            <Avatar className="h-16 w-16 border-2 border-border group-hover:border-primary transition-colors">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="text-lg bg-muted">U</AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
              <Camera className="h-3 w-3" />
            </div>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="identity.full_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="identity.age" render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              <FormControl><Input type="number" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="identity.gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full"> {/* Full Width */}
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />

          <FormField control={form.control} name="identity.country" render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl><Input placeholder="India" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>
      </div>

      <Separator />

      {/* SECTION: DEMOGRAPHICS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Demographics</h3>
          <p className="text-sm text-muted-foreground">Education and professional background.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="demographics.education_level" render={({ field }) => (
            <FormItem>
              <FormLabel>Education Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full"> {/* Full Width */}
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="high_school">High School</SelectItem>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="postgraduate">Postgraduate</SelectItem>
                  <SelectItem value="phd">PhD</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="demographics.current_role" render={({ field }) => (
            <FormItem>
              <FormLabel>Current Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full"> {/* Full Width */}
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="unemployed">Unemployed</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>
      </div>
    </div>
  );
}