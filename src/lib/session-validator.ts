import { NextRequest } from "next/server";
import { BETTER_AUTH_SESSION_ENDPOINT } from "~/data/auth-config";

/**
 * Validates a session by calling Better Auth's session endpoint
 * This is Edge-compatible and works without session cache
 *
 * Production cookie handling:
 * - Forwards all cookies to Better Auth API
 * - Better Auth automatically handles __Secure- and __Host- prefixes
 * - No need to manually extract cookie names
 */
export async function validateSession(request: NextRequest) {
  try {

    // Get base URL from environment or construct from request
    const baseUrl =
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      process.env.BETTER_AUTH_URL;

    // Build the full URL for the request
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const host = request.headers.get("host") || "localhost:3000";
    const fullBaseUrl = baseUrl?.startsWith("http")
      ? baseUrl
      : `${protocol}://${host}/api/v1/auth`;

    // Use Better Auth's session endpoint from config
    // Update BETTER_AUTH_SESSION_ENDPOINT if Better Auth changes their API
    const sessionEndpoint = `${fullBaseUrl}${BETTER_AUTH_SESSION_ENDPOINT}`;

    const response = await fetch(sessionEndpoint, {
      method: "GET",
      headers: {
        // Forward the cookie header from the request to include all auth cookies
        cookie: request.headers.get("cookie") || "",
      },
      // CRITICAL: Disable Next.js fetch caching to always get fresh session data
      cache: "no-store",
      // Also add cache control headers to prevent any HTTP caching
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return { valid: false, session: null };
    }

    const sessionData = await response.json();

    // Better Auth returns { session, user, userPermissions } from customSession plugin
    // If session is null, user is not authenticated
    if (!sessionData || !sessionData.session) {
      return { valid: false, session: null };
    }

    // Check if session has expired
    const expiresAt = new Date(sessionData.session.expiresAt);
    const now = new Date();

    if (expiresAt <= now) {
      return { valid: false, session: null, expired: true };
    }

    return { valid: true, session: sessionData };
  } catch (error) {
    console.error("Session validation error:", error);
    // On error, assume invalid to be safe
    return { valid: false, session: null };
  }
}
