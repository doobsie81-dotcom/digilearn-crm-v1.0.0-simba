import { betterAuth, BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "~/db";
import * as schema from "~/db/schema";
import { nextCookies } from "better-auth/next-js";
import { admin, customSession } from "better-auth/plugins";
import { hashPassword, verifyPassword } from "./argon2";
import { headers } from "next/headers";
import { createCustomRoles } from "./permissions";
import { eq } from "drizzle-orm";
import { SESSION_COOKIE_PREFIX } from "~/data/auth-config";

type Role = (typeof schema.UserRoles)[number];

const options = {
  database: drizzleAdapter(db, {
    provider: "mysql",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  // account: {
  //   accountLinking: {
  //     enabled: true,
  //   },
  // },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    autoSignIn: false,
    minPasswordLength: 6,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "sales-agent",
        required: true,
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // every day
    freshAge: 60 * 60, // every minute
    // cookieCache: {
    //   enabled: true,
    //   maxAge: 5 * 60,
    // },
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL:
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3000/api/v1/auth",
  trustedOrigins: [
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
      "http://localhost:3000/api/v1/auth",
  ],
  telemetry: {
    debug: process.env.NODE_ENV !== "production",
  },
  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["admin", "manager"] as Role[],
      defaultRole: "sales-agent" as Role,
      roles: {
        ...createCustomRoles(), // this can be used to pass permission, even from the database.
      },
    }),
  ],
  advanced: {
    database: {
      generateId: false,
    },
    cookiePrefix: SESSION_COOKIE_PREFIX,
    crossSubDomainCookies: {
      enabled: false, // unless you need this
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      // Add debugging
      console.log("CustomSession called:", {
        userId: user?.id,
        userEmail: user?.email,
        sessionId: session?.id,
        sessionUserId: session?.userId,
      });

      if (!user || !session) {
        console.log("No user or session, returning empty");
        return {};
      }

      // CRITICAL: Verify the session.userId matches user.id
      if (session.userId !== user.id) {
        console.error("SESSION MISMATCH:", {
          sessionUserId: session.userId,
          actualUserId: user.id,
          sessionEmail: user.email,
        });

        // Force session invalidation on mismatch
        return {};
      }

      const dbPermissions = await db.query.permissions.findMany({
        where: eq(schema.permissions.role, user.role as Role),
      });

      console.log(
        "Returning session for:",
        user.email,
        "with",
        dbPermissions.length,
        "permissions"
      );

      return {
        session,
        user,
        userPermissions: dbPermissions,
      };
    }, options),
  ],
});

export type CustomSession = {
  session: (typeof schema.session)["$inferSelect"];
  user: (typeof schema.user)["$inferSelect"] & { role: string };
  userPermissions: (typeof schema.permissions)["$inferSelect"][];
} | null;

/**
 * Gets the current server session without caching
 * IMPORTANT: Cache was removed to prevent stale session data after logout/login
 */
export const getServerSession = async () => {
  return (await auth.api.getSession({
    headers: await headers(),
    // Disable any internal caching
    query: {
      disableCookieCache: "true",
    },
  })) as CustomSession;
};

export const SESSION_COOKIE_NAME = `${options.advanced.cookiePrefix || "better-auth"}.session_token`;
