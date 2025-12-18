"use client";
import { useEffect } from "react";
import { authClient } from "~/lib/auth-client";

export function SessionRefresher() {
  const { refetch } = authClient.useSession()
  useEffect(() => {
    const onFocus = () => refetch({
      query: {
        disableCookieCache: true
      }
    })
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refetch])
  return null
}
