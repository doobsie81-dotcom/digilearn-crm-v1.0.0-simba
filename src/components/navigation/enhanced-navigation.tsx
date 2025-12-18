"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { trpc } from "~/trpc/client";
import { useFilteredNavigation } from "~/hooks/use-filtered-navigation";

interface EnhancedNavigationProps {
  className?: string;
}

export function EnhancedNavigation({ className }: EnhancedNavigationProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Core Views",
    "Sales & Revenue",
    "Activity Management",
  ]);
  const pathname = usePathname();
  const navigationSections = useFilteredNavigation();

  const {
    data: settings,
    isLoading,
    //error: settingsError,
  } = trpc.settings.getAll.useQuery();

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionTitle)
        ? prev.filter((title) => title !== sectionTitle)
        : [...prev, sectionTitle]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const title = settings
    ? settings["company_name"] || "ClearHue CRM"
    : "v1.0.0 - Fallback";

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-background border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-md bg-gray-100 border border-gray-300 flex items-center justify-center">
              <span className="text-sm font-bold text-black">D</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-truncate">
                {!isLoading ? title : "..."}
              </h1>
              <p className="text-xs text-muted-foreground text-truncate">
                Professional Edition
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-7 w-7 p-0 hover:bg-muted"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2.5">
        {navigationSections.map((section) => (
          <div key={section.title} className="mb-3">
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between py-1.5 px-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
              >
                <span className="text-truncate">{section.title}</span>
                {expandedSections.includes(section.title) ? (
                  <ChevronRight className="h-3 w-3 rotate-90 transition-transform flex-shrink-0 ml-1" />
                ) : (
                  <ChevronRight className="h-3 w-3 transition-transform flex-shrink-0 ml-1" />
                )}
              </button>
            )}

            {(collapsed || expandedSections.includes(section.title)) && (
              <div className={cn("space-y-0.5", !collapsed && "mt-1")}>
                {section.items.map((item) => {
                  const isItemActive = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2.5 rounded-md px-2.5 py-1.5 text-xs transition-all duration-200 group relative",
                        isItemActive
                          ? "bg-white text-black border border-black shadow-sm"
                          : "text-black hover:text-black hover:bg-gray-50"
                      )}
                      title={
                        collapsed
                          ? `${item.title} - ${item.description}`
                          : undefined
                      }
                    >
                      <Icon
                        className={cn(
                          "h-3.5 w-3.5 flex-shrink-0",
                          isItemActive ? "text-black" : "text-black"
                        )}
                      />
                      {!collapsed && (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-truncate pr-1">
                                {item.title}
                              </span>
                              {item.badge && (
                                <Badge
                                  variant={
                                    isItemActive ? "secondary" : "default"
                                  }
                                  className="h-4 text-xs px-1.5 py-0 flex-shrink-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            {/* {item.description && (
                              <p className="text-xs opacity-70 mt-0.5 text-clamp-2">
                                {item.description}
                              </p>
                            )} */}
                          </div>
                        </>
                      )}

                      {/* Tooltip for collapsed state */}
                      {collapsed && (
                        <div className="absolute left-16 bg-popover text-popover-foreground px-2 py-1 rounded-md text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap border ">
                          <div className="font-medium">{item.title}</div>
                          {/* <div className="text-muted-foreground">{item.description}</div> */}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}

            {!collapsed && <Separator className="mt-2" />}
          </div>
        ))}
      </div>

      {/* User Profile Section */}
      {/* <div className="border-t border-border/50 p-2.5">
        <Link
          href="/profile"
          className={cn(
            'flex items-center space-x-2.5 rounded-md px-2.5 py-2 text-xs transition-all duration-200 hover:bg-muted/50',
            isActive('/profile') && 'bg-white text-black border border-black shadow-sm'
          )}
        >
          <div className="h-7 w-7 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center flex-shrink-0">
            <User className="h-3.5 w-3.5 text-black" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-truncate">John Doe</p>
              <p className="text-xs text-muted-foreground text-truncate">Sales Manager</p>
            </div>
          )}
        </Link>
      </div> */}
    </div>
  );
}
