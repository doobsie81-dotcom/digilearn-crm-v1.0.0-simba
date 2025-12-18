"use client";

import { EnhancedNavigation } from "~/components/navigation/enhanced-navigation";
import { TopBar } from "~/components/layout/topbar";
import { OutlookConnectionModal } from "../modals/outlook-connect-modal";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Wrapper component for protected routes that require authentication
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  return (
    <div className="flex h-full">
      
      <OutlookConnectionModal />
      {/* Enhanced Navigation */}
      <EnhancedNavigation />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-secondary/50">
          {children}
        </main>
      </div>
    </div>
  );
}
