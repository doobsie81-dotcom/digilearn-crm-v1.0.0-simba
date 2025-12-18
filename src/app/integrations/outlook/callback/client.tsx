
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "~/trpc/client";
import { useOutlookStore } from "~/store/use-outlook-store";
import Link from "next/link";

export default function OutlookCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setError, error } = useOutlookStore();

  const getTokenMutation = trpc.emailing.getAccessToken.useMutation();

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Authorization failed: ${errorParam}`);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      return;
    }

    // Exchange code for token
    getTokenMutation.mutate(
      { code },
      {
        onSuccess: (data) => {
          // Store tokens in Zustand store
          setTokens(data.accessToken, data.refreshToken, data.expiresIn);

          // Optionally also store in localStorage for persistence
          localStorage.setItem("outlook_access_token", data.accessToken);
          localStorage.setItem("outlook_refresh_token", data.refreshToken);
          localStorage.setItem(
            "outlook_token_expiry",
            String(Date.now() + data.expiresIn * 1000)
          );

          // Redirect to app
          router.push("/");
        },
        onError: (error) => {
          setError(error.message);
        },
      }
    );
  }, [searchParams]);

  if (error) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error}</p>
          <Link href="/">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-screen place-items-center">
      Processing authorization...
    </div>
  );
}


