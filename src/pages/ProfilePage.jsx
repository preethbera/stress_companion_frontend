import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { ProfileForm } from "@/components/features/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="flex-1 container max-w-5xl mx-auto py-8 px-4">
      <ProfileForm />
    </div>
  );
}
