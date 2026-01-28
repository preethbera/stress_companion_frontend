import React from "react";
import { Navbar } from "./Navbar";

/**
 * Layout Component
 * Provides a consistent shell including the Navbar and centered responsive content area.
 */
export const Layout = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <Navbar user={user} onLogout={onLogout} />
      
      {/* Main Content Area:
          1. container mx-auto: Centers the content horizontally.
          2. px-4 md:px-8: Responsive horizontal padding (gutter).
          3. max-w-7xl: Limits width on ultra-wide monitors for better readability.
          4. flex-1: Ensures the main area grows to fill the screen (useful for footers).
      */}
      <main className="flex-1 container mx-auto px-4 md:px-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
};