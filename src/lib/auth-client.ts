import { createAuthClient } from "better-auth/react";
import { adminClient, customSessionClient } from "better-auth/client/plugins";
import { auth, CustomSession } from "./auth";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000/api/v1/auth",
  fetchOptions: {
    credentials: "include", // Important for cookies
  },
  plugins: [adminClient(), customSessionClient<typeof auth>()],
});

export const { signIn, signUp, getSession, signOut } = authClient;

export const useSession = () =>
  authClient.useSession() as ReturnType<typeof authClient.useSession> & { data: CustomSession };

// Export authClient for direct access to methods with custom options
