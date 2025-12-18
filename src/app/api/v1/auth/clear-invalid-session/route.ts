// app/api/auth/clear-invalid-session/route.ts
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "~/lib/auth";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_PREFIX } from "~/data/auth-config";

export async function GET() {
  const cookieStore = await cookies();

  // Determine the correct cookie prefix based on environment
  const cookiePrefix =
    process.env.NODE_ENV === "production"
      ? `__Secure-${SESSION_COOKIE_PREFIX}`
      : SESSION_COOKIE_PREFIX;

  // Delete all possible session cookies
  cookieStore.delete(`${cookiePrefix}.session_token`);
  cookieStore.delete(`${cookiePrefix}.session_data`);

  // Also try without prefix in case of misconfiguration
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(`${SESSION_COOKIE_PREFIX}.session_data`);

  return redirect("/auth/login");
}
