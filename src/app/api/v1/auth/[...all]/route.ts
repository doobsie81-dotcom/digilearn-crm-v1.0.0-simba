import { auth } from "~/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);

// Disable caching for auth routes to prevent stale session data
export const dynamic = "force-dynamic";
export const revalidate = 0;
