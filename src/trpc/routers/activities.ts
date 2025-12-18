import { z } from "zod";
// import { TRPCError } from "@trpc/server";
import { eq, and, or } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { leadActivities } from "~/db/schema";
import { db } from "~/db";
import { can, getUserPermissions } from "~/lib/get-user-permissions";
import { TRPCError } from "@trpc/server";

export const activitiesRouter = createTRPCRouter({
  getAllActivities: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/activities" } })
    .input(
      z.object({
        leadId: z.string().nullish(),
        dealId: z.string().nullish(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "LeadActivity")[0]
        .conditions;

      const allowed = can(abilities, "read", "LeadActivity");

      const owner = ruleConditions?.createdBy;

      console.log(owner);

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view activities",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own activities",
        });
      }

      if (owner) {
        conditions.push(
          or(
            eq(leadActivities.createdBy, owner as string),
            eq(leadActivities.assignedTo, owner as string)
          )
        );
      }
      if (input.leadId) {
        conditions.push(eq(leadActivities.leadId, input.leadId));
      }
      if (input.dealId) {
        conditions.push(eq(leadActivities.dealId, input.dealId));
      }

      const activities = await db.query.leadActivities.findMany({
        where: and(...conditions),
        with: {
          email: true,
          meeting: true,
          note: true,
          task: true,
          lead: true,
          deal: true,
          assignedToUser: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
          createdByUser: {
            columns: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: (activity, { desc }) => desc(activity.createdAt),
      });

      return activities;
    }),
});
