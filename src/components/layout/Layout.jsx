import React from "react";
import { Navbar } from "./Navbar";

export const Layout = ({ children, user, onLogout, fullWidth = false }) => {
  return (
    // FIX: Changed min-h-screen to h-screen so the app never exceeds the viewport height.
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      
      {/* Navbar stays fixed at the top */}
      <div className="shrink-0">
        <Navbar user={user} onLogout={onLogout} />
      </div>
      
      {/* Main Content:
          flex-1: Fills remaining space
          min-h-0: ALLOWS children to shrink and scroll (Critical for chat apps)
          overflow-hidden: Prevents double scrollbars
      */}
      <main className={`flex-1 min-h-0 overflow-hidden ${
        fullWidth 
          ? "w-full flex flex-col" // Added flex-col to ensure children fill height
          : "container mx-auto px-4 md:px-8 max-w-7xl overflow-y-auto" // Standard pages can scroll
      }`}>
        {children}
      </main>
    </div>
  );
};