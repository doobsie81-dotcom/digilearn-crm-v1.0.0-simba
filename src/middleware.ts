import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { SESSION_COOKIE_PREFIX } from "./data/auth-config";
import { validateSession } from "./lib/session-validator";

const ProtectedRoutes = ["/"];

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Check route type early to prevent redirect loops
  const isOnProtectedRoute =
    ProtectedRoutes.includes(nextUrl.pathname) &&
    !nextUrl.pathname.startsWith("/auth");
  const isOnAuthRoute = nextUrl.pathname.startsWith("/auth");

  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: SESSION_COOKIE_PREFIX,
  });

  let isLoggedIn = !!sessionCookie;

  // Validate session if cookie exists
  if (isLoggedIn) {
    const { valid } = await validateSession(request);
    if (!valid) {
      isLoggedIn = false;

      // Only redirect to login if on a protected route (not if already on auth route)
      if (isOnProtectedRoute) {
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url)
        );

        const cookiePrefix =
          process.env.NODE_ENV === "production"
            ? `__Secure-${SESSION_COOKIE_PREFIX}`
            : SESSION_COOKIE_PREFIX;

        response.cookies.delete(`${cookiePrefix}.session_token`);
        response.cookies.delete(`${cookiePrefix}.session_data`);

        return response;
      }

      // If on auth route with invalid session, just clear cookies and continue
      if (isOnAuthRoute) {
        const response = NextResponse.next();

        const cookiePrefix =
          process.env.NODE_ENV === "production"
            ? `__Secure-${SESSION_COOKIE_PREFIX}`
            : SESSION_COOKIE_PREFIX;

        response.cookies.delete(`${cookiePrefix}.session_token`);
        response.cookies.delete(`${cookiePrefix}.session_data`);

        return response;
      }
    }
  }

  if (isOnProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isOnAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
