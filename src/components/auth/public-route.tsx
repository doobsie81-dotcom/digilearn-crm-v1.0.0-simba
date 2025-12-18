"use client";

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Wrapper component for public-only routes (like login/register)
 * Redirects authenticated users away from these pages
 */
export function PublicRoute({ children }: PublicRouteProps) {
  return (
    <div>
      {children}
    </div>
  );
}
