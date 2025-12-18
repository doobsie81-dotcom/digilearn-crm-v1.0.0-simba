"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { useMobile } from "~/contexts/mobile-context";
import { Menu, Search, Bell, Settings, User } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import LogoutButton from "../logout-button";
import { useSession } from "~/lib/auth-client";

export function TopBar() {
  const pathname = usePathname();
  const pageName = getPageName(pathname);
  const { toggleMobileMenu } = useMobile();
  const session = useSession();
  const user = session?.data?.user;
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      toast.info(`Searching for: ${searchTerm}`, {
        description: "Global search functionality coming soon!",
      });
    }
  };

  const handleNotifications = () => {
    toast.info("Notifications", {
      description:
        "You have 3 new notifications. Notification center coming soon!",
    });
  };

  const handleSettings = () => {
    toast.info("Settings", {
      description:
        "Settings panel coming soon! Configure your preferences here.",
    });
  };

  const handleMobileSearch = () => {
    toast.info("Mobile Search", {
      description: "Mobile search modal coming soon!",
    });
  };

  return (
    <div className="flex h-16 items-center justify-between border-b bg-card px-3 sm:px-4 lg:px-6">
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Mobile hamburger menu */}
        <button
          data-mobile-toggle
          onClick={toggleMobileMenu}
          className="p-2 rounded-md hover:bg-accent lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-base sm:text-lg font-semibold truncate">
          {pageName}
        </h1>

        {/* Conditional Badges - hide on very small screens */}
        {/* {pathname === "/leads" && (
          <Badge
            variant="outline"
            className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20"
          >
            24 Active Leads
          </Badge>
        )} */}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Search - hide on mobile, show on larger screens */}
        <form onSubmit={handleSearch} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-search pl-10 w-48 lg:w-64"
          />
        </form>

        {/* Mobile search button */}
        <button
          onClick={handleMobileSearch}
          className="p-2 rounded-md hover:bg-accent md:hidden"
          aria-label="Search"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Notifications */}
        <button
          onClick={handleNotifications}
          className="relative rounded-md p-2 hover:bg-accent"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        {/* Settings */}
        <button
          onClick={handleSettings}
          className="rounded-md p-2 hover:bg-accent"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center space-x-2 rounded-md p-2 hover:bg-accent">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs">
                {user?.name
                  ? user.name.charAt(0).toUpperCase()
                  : user?.email?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block text-sm font-medium max-w-24 truncate">
              {user?.name || user?.email?.split("@")[0] || "User"}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  Role: {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <LogoutButton
                showIcon
                variant="ghost"
                size="sm"
                className="w-full border-none hover:border-none justify-start text-destructive"
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function getPageName(pathname: string): string {
  if (pathname === "/") return "Dashboard";
  return pathname
    .slice(1)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
