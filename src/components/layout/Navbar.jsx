import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  History,
  MessageCircle,
  User,
  Settings,
  MessageSquare,
  LogOut,
  Leaf,
  Menu,
  Bell,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// --- Configuration Constants ---

const NAV_ITEMS = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    label: "Chat",
    icon: MessageCircle,
    href: "/chat",
  },
  {
    label: "History",
    icon: History,
    href: "/history",
  },
];

const USER_MENU_ITEMS = [
  {
    label: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings",
  },
  {
    label: "Feedback",
    icon: MessageSquare,
    href: "/feedback",
  },
];

const AVATAR_SIZES = {
  small: "h-8 w-8",
  default: "h-10 w-10",
};

// --- Sub-Components ---

function NavLink({ item, isActive, className = "", onClick }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      } ${className}`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  );
}

function UserAvatar({ user, size = "default" }) {
  return (
    <Avatar className={`${AVATAR_SIZES[size]} border`}>
      <AvatarImage src={user?.avatarUrl} alt={user?.name || "User"} />
      <AvatarFallback>
        {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
      </AvatarFallback>
    </Avatar>
  );
}

// --- Main Component ---

export function Navbar({ user = null, onLogout }) {
  const location = useLocation();

  return (
    <nav className="border-b bg-background sticky top-0 z-50 w-full">
      <div className="flex h-16 items-center px-4 md:px-8 justify-between">
        {/* LEFT SECTION: Logo & Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Mobile Menu Sheet */}
          {user && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader className="flex-row items-center justify-between space-y-0 border-b h-16">
                  <SheetTitle className="flex items-center gap-2 text-left px-2">
                    <Leaf className="h-5 w-5 text-primary" />
                    Stress Companion
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Mobile navigation menu to access dashboard and settings.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-1 px-2">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      isActive={location.pathname === item.href}
                      className="text-base py-3"
                    />
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-xl text-primary"
          >
            <Leaf className="h-5 w-5" />
            <span className="hidden sm:inline">Stress Companion</span>
          </Link>
        </div>

        {/* RIGHT SECTION: Desktop Nav & User Actions */}
        <div className="flex items-center gap-4">
          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-2 mr-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href}
                />
              ))}
              <div className="h-6 w-px bg-border ml-2"></div>
            </div>
          )}

          {/* Notifications */}
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
          )}

          {/* Auth Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <UserAvatar user={user} />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center gap-4">
                    <UserAvatar user={user}  />
                    <div className="flex flex-col space-y-1.5">
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
                <DropdownMenuGroup>
                  {USER_MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link to={item.href} className="cursor-pointer">
                          <Icon className="mr-2 h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    onLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
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
