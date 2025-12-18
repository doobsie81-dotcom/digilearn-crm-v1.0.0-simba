"use client";

import { PublicRoute } from "~/components/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PublicRoute>
      <div className="grid place-items-center min-h-screen bg-gradient-[radial(at_top_right,_var(--tw-gradient-stops))] from-white via-blue-50 to-blue-100 p-8 sm:p-20">
        {children}
      </div>
    </PublicRoute>
  );
}
