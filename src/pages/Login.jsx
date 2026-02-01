import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { LoginForm } from "@/components/features/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar /> {/* Pass props if needed */}
      <div className="flex-1 flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </div>
  );
}
