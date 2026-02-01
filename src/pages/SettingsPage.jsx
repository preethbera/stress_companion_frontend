import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { SettingsForm } from "@/components/features/SettingsForm";

export default function SettingsPage() {
  // Mock User for Navbar
  const user = { name: "Preeth", email: "preeth@example.com", avatarUrl: "" };

  return (
    <div className="flex-1 container max-w-5xl mx-auto py-8">
      <SettingsForm />
    </div>
  );
}
