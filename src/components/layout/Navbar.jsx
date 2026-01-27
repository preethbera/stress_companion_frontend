import React from "react";
import { Link } from "react-router-dom"; // CHANGE 1: Import Link
import {
  LayoutDashboard,
  History,
  User,
  Settings,
  MessageSquare,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar({ user = null, onLogout }) {
  return (
    <nav className="border-b bg-background sticky top-0 z-50 w-full">
      <div className="flex h-16 items-center px-4 md:px-8 justify-between">
        {/* LEFT SECTION: Logo */}
        <div className="flex items-center gap-2">
          {/* CHANGE 2: Use Link instead of a tag */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-primary"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <span className="text-lg">S</span>
            </div>
            <span className="hidden sm:inline">StressCompanion</span>
          </Link>
        </div>

        {/* RIGHT SECTION: Navigation & User */}
        <div className="flex items-center gap-4">
          {/* DESKTOP NAV LINKS - Only visible if user exists */}
          {user && (
            <div className="hidden md:flex items-center gap-6 text-sm font-medium mr-2">
              <Link
                to="/dashboard"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                to="/history"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="h-4 w-4" />
                History
              </Link>
              <div className="h-6 w-px bg-border"></div>
            </div>
          )}

          {/* AUTH SECTION */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-10 w-10 border hover:border-primary transition-all">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>
                      {user.name ? user.name.charAt(0) : "U"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-64" align="end" forceMount>
                {/* Header */}
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback>
                        {user.name ? user.name.charAt(0) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                {/* MOBILE ONLY LINKS */}
                <DropdownMenuGroup className="md:hidden">
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/history" className="cursor-pointer">
                      <History className="mr-2 h-4 w-4" />
                      <span>History</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </DropdownMenuGroup>

                {/* Standard Menu Items */}
                <DropdownMenuGroup>
                  {/* CHANGE 3: Link to Profile Page */}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Feedback</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer focus:bg-red-50"
                  onSelect={(event) => {
                    event.preventDefault();
                    onLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // LOGGED OUT STATE
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
