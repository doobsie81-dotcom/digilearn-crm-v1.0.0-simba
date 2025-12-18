"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import AddAdminUser from "~/components/forms/add-admin.form";
import { Form } from "~/components/ui/form";
import { signUp } from "~/lib/auth-client";

const adminUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AdminUserValues = z.infer<typeof adminUserSchema>;

/*
  InstallationProvider:
  - Checks if installation is complete by querying the settings table
  - If not complete, forces user to create an admin account
  - After admin creation, marks installation as complete
*/

export function InstallationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [isInstallationComplete, setIsInstallationComplete] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AdminUserValues>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
  });

  useEffect(() => {
    let mounted = true;

    async function checkInstallation() {
      try {
        const response = await fetch("/api/installation/check");
        const data = await response.json();

        if (mounted) {
          setIsInstallationComplete(data.isInstallationComplete);
          setReady(true);
        }
      } catch (err) {
        console.error("Error checking installation status:", err);
        if (mounted) {
          setIsInstallationComplete(false);
          setReady(true);
        }
      }
    }

    checkInstallation();
    return () => {
      mounted = false;
    };
  }, []);

  const onSubmit = async (data: AdminUserValues) => {
    setIsPending(true);
    setError(null);

    try {
      // Create the admin user using Better Auth
      const { data: signUpData, error: signUpError } = await signUp.email(
        {
          email: data.email,
          name: data.name,
          password: data.password,
        },
        {
          onRequest: () => {
            console.log("Creating admin user...");
          },
          onError: (ctx) => {
            console.error("Sign up error:", ctx.error);
          },
        }
      );

      if (signUpError) {
        setError(signUpError.message || "Failed to create admin user");
        setIsPending(false);
        return;
      }

      // Mark installation as complete
      if (signUpData?.user?.id) {
        const response = await fetch("/api/installation/complete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: signUpData.user.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to complete installation");
        }

        // Update state to show app is ready
        setIsInstallationComplete(true);
        setIsPending(false);

        // Redirect to login or dashboard
        window.location.href = "/auth/login";
      }
    } catch (err) {
      console.error("Installation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete installation"
      );
      setIsPending(false);
    }
  };

  // Show loading state while checking installation status
  if (!ready) {
    return (
      <div className="grid place-items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show installation form if not complete
  if (!isInstallationComplete) {
    return (
      <div className="grid place-items-center min-h-screen bg-gradient-[radial(at_top_right,_var(--tw-gradient-stops))] from-white via-blue-50 to-blue-100 p-8 sm:p-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome to DigiLearn CRM
              </h1>
              <p className="text-gray-600">
                Let&apos;s get started by creating your admin account
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <Form {...form}>
              <AddAdminUser
                onSubmit={form.handleSubmit(onSubmit)}
                isPending={isPending}
                error={
                  error
                    ? { message: error, status: 400, statusText: "Error" }
                    : null
                }
              />
            </Form>
          </div>
        </div>
      </div>
    );
  }

  // Installation complete, render the app
  return <>{children}</>;
}

export default InstallationProvider;
