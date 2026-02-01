import React from "react";
import { Navbar } from "./Navbar";

/**
 * Layout Component
 * Provides a consistent shell including the Navbar and centered responsive content area.
 */
export const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <Navbar user={user} onLogout={onLogout} />
      <main className="flex-1 container mx-auto px-4 md:px-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
};