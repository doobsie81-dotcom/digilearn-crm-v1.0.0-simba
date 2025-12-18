import { initTRPC, TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { cache } from "react";
import superjson from "superjson";
import { db } from "~/db";
import { permissions, user } from "~/db/schema";
import { getServerSession } from "~/lib/auth";
import { OpenApiMeta } from "trpc-openapi";

export const createTRPCContext = cache(async () => {
  const session = await getServerSession();
  return {
    userId: session?.user.id,
    user: session?.user,
    userPermissions: session?.userPermissions,
  };
});

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC
  .context<Context>()
  .meta<OpenApiMeta>()
  .create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});

// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const [dbUser] = await db
    .select()
    .from(user)
    .where(eq(user.id, ctx.userId))
    .limit(1);

  if (!dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }

  const userPermissions = await db
    .select()
    .from(permissions)
    .where(eq(permissions.role, dbUser.role));

  return next({
    ctx: {
      ...ctx,
      user: dbUser,
      userPermissions,
    },
  });
});
