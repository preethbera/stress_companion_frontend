import React, { useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE } from "@/config/api";
import { toast } from "sonner";

export function GeneralInfoTab({ form }) {
  const { user, uploadProfileImage } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);

  // Parse accurate avatar URL from backend relative path
  let avatarUrl = undefined;
  if (user?.profile_image_path) {
    // Ensuring no double slashes depending on how server saved it
    const cleanPath = user.profile_image_path.replace(/\\/g, "/").replace(/^\/+/, "");
    avatarUrl = `${API_BASE}/${cleanPath}`;
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    try {
      await uploadProfileImage(file);
      toast.success("Profile image updated successfully!");
    } catch (error) {
      toast.error("Failed to upload image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* SECTION: IDENTITY */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-foreground">Personal Identity</h3>
            <p className="text-sm text-muted-foreground">Basic information to identify your profile.</p>
          </div>
          {/* USER AVATAR COMPONENT */}
          <div 
            className={`relative cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`} 
            onClick={() => document.getElementById("profile-image-upload").click()}
          >
            {/* Avatars remain circular (rounded-full) as per standard design patterns */}
            <Avatar className="h-16 w-16 border-2 border-border group-hover:border-primary transition-colors">
              <AvatarImage src={avatarUrl} className="object-cover" />
              <AvatarFallback className="text-lg bg-muted text-muted-foreground">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md border-2 border-background">
              {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </div>
            {/* Hidden Input for handling upload */}
            <input 
              type="file" 
              id="profile-image-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload} 
            />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="identity.full_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              {/* UPDATED: rounded-md */}
              <FormControl><Input placeholder="John Doe" {...field} className="rounded-md bg-background" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="identity.age" render={({ field }) => (
            <FormItem>
              <FormLabel>Age</FormLabel>
              {/* UPDATED: rounded-md */}
              <FormControl><Input type="number" {...field} className="rounded-md bg-background" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="identity.gender" render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  {/* UPDATED: rounded-md */}
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                {/* UPDATED: rounded-md */}
                <SelectContent className="rounded-md">
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
              {/* UPDATED: rounded-md */}
              <FormControl><Input placeholder="India" {...field} className="rounded-md bg-background" /></FormControl>
            </FormItem>
          )} />
        </div>
      </div>

      <Separator className="bg-border" />

      {/* SECTION: DEMOGRAPHICS */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-foreground">Demographics</h3>
          <p className="text-sm text-muted-foreground">Education and professional background.</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <FormField control={form.control} name="demographics.education_level" render={({ field }) => (
            <FormItem>
              <FormLabel>Education Level</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  {/* UPDATED: rounded-md */}
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                </FormControl>
                {/* UPDATED: rounded-md */}
                <SelectContent className="rounded-md">
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
              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                <FormControl>
                  {/* UPDATED: rounded-md */}
                  <SelectTrigger className="w-full rounded-md bg-background">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                </FormControl>
                {/* UPDATED: rounded-md */}
                <SelectContent className="rounded-md">
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