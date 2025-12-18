import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import z from "zod";
import { Input } from "~/components/ui/input";
import { db } from "~/db";
import { user, UserRoles } from "~/db/schema";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";

export const usersRouter = createTRPCRouter({
  getAll: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/users" } })
    .input(
      z.object({
        isBanned: z.boolean().optional().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx?.user.role !== "admin") {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
      }

      const { isBanned } = input;
      const conditions = [];
      if (!isBanned) {
        conditions.push(eq(user.banned, false));
      } else {
        conditions.push(eq(user.banned, isBanned));
      }

      const users = await db.query.user.findMany({
        where: conditions.length ? and(...conditions) : undefined,
      });
      return users;
    }),
  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/users/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      if (ctx?.user.role !== "admin" && ctx.user.id !== input.id) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
      }

      const u = await db.query.user.findFirst({
        where: eq(user.id, input.id),
      });

      if (!u) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User was not found",
        });
      }

      return u;
    }),
  getByRole: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/users/by-role" } })
    .input(
      z.object({
        roles: z.array(z.enum(UserRoles)),
      })
    )
    .query(async ({ input }) => {
      const users = await db.query.user.findMany({
        where: inArray(user.role, input.roles),
      });
      return users;
    }),
});
