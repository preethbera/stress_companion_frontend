import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <RegisterForm />
      </div>
    </div>
  );
}