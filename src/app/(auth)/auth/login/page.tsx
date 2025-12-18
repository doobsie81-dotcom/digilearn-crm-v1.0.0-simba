"use client";

import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "~/components/ui/input";
import { Lock, Mail } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useTransition, useState } from "react";
import { signIn, authClient, useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";
import AuthHeader from "../_components/auth-header";
import { Skeleton } from "~/components/ui/skeleton";
import { trpc } from "~/trpc/client";

const IDENTITY_TYPES = ["email", "phone"] as const;

const loginFormSchema = z
  .object({
    identityType: z.enum(IDENTITY_TYPES, {
      message: `Identity type should be one of these (${IDENTITY_TYPES.join(
        ", "
      )})`,
    }),
    // make identity required so we can validate its format
    identity: z.string().min(1, "Identity is required"),
    password: z
      .string()
      .min(6, "Password should be at least 6 Characters long")
      .max(100),
  })
  .superRefine((data, ctx) => {
    // validate identity format depending on chosen identityType
    const id = data.identity?.trim();

    if (data.identityType === "email") {
      // use zod's email check for proper error messages
      const result = z.email().safeParse(id);
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["identity"],
          message: "Please provide a valid email address",
        });
      }
    } else if (data.identityType === "phone") {
      // basic E.164-like validation: optional + and 7-15 digits
      const phoneRe = /^\+?[1-9]\d{6,14}$/;
      if (!phoneRe.test(id || "")) {
        ctx.addIssue({
          code: "custom",
          path: ["identity"],
          message:
            "Please provide a valid phone number (7–15 digits, optional +)",
        });
      }
    } else {
      // fallback: identityType was enumerated but keep a safeguard
      ctx.addIssue({
        code: "custom",
        path: ["identityType"],
        message: "Unknown identity type",
      });
    }
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  //const searchParams = useSearchParams();
  const { refetch } = useSession();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    data: settings,
    isLoading,
    //error: settingsError,
  } = trpc.settings.getAll.useQuery();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      identityType: "email",
      identity: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        setError(null);

        const { data: signInData, error: signInError } = await signIn.email(
          {
            email: data.identity,
            password: data.password,
          },
          {
            onSuccess() {
              refetch();
            },
          }
        );

        if (signInError) {
          setError(signInError.message || "Failed to sign in");
          return;
        }

        if (signInData) {
          // Redirect to original destination or dashboard
          const redirectTo = "/"; //searchParams.get("redirect") || "/";
          router.replace(redirectTo);
        }
      } catch (err) {
        console.error("Login error:", err);
        setError(
          err instanceof Error ? err.message : "An error occurred during login"
        );
      }
    });
  };

  const title = settings
    ? settings["company_name"] || "DigiLearn CRM"
    : "DigiLearn CRM";

  return (
    <div className="max-w-lg w-full  bg-white p-8 rounded-lg border border-border">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-1/2" />
        </div>
      ) : (
        <div className="space-y-4">
          <AuthHeader
            title={title}
            subtitle="Welcome back. Please Enter your email and passwrd to login"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                name="identity"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute h-4 w-4 top-3 left-3" />
                        <Input
                          className="pl-12"
                          placeholder="Enter your email"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute h-4 w-4 top-3 left-3" />
                        <Input
                          className="pl-12"
                          type="password"
                          placeholder="******"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Signing in..." : "Login"}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  );
}
