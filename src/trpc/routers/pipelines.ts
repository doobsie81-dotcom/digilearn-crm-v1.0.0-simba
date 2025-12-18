import z from "zod";
import { db } from "~/db";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { TRPCError } from "@trpc/server";
import { PipelineStageSchema, deals } from "~/db/schema";
import { and, eq } from "drizzle-orm";
import { can, getUserPermissions } from "~/lib/get-user-permissions";

export const pipelinesRouter = createTRPCRouter({
  getPipelines: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/pipelines" } })
    .input(
      z.object({
        stage: z.string().optional(),
      })
    )
    .query(async (opts) => {
      try {
        const { stage } = opts.input;
        let match = null;

        if (stage) {
          match = and(eq(PipelineStageSchema.name, stage));
        }
        const pipelines = await db.query.PipelineStageSchema.findMany({
          ...(match ? { where: match } : {}),
          orderBy: (PipelineStageSchema, { asc }) =>
            asc(PipelineStageSchema.order),
        });
        return pipelines;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occured while fetching pipelines",
        });
      }
    }),
  getPipelinesWithDeals: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/pipelines/with-deals" } })
    .input(
      z.object({
        stage: z.string(),
      })
    )
    .query(async (opts) => {
      try {
        const { stage } = opts.input;
        let match = null;

        const abilities = await getUserPermissions(
          opts.ctx.user,
          opts.ctx.userPermissions
        );

        const ruleConditions = abilities.rulesFor("read", "Deal")[0].conditions;

        const allowed = can(abilities, "read", "Deal");

        const owner = ruleConditions?.assignedTo;

        // If user is not allowed to view other leads, they MUST specify their own ID
        if (!allowed && !owner) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must specify your own user ID to view leads",
          });
        }

        // Enforce that non-allowed users can only view their own leads
        if (!allowed && owner && owner && owner !== opts.ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You can only view your own leads",
          });
        }

        if (stage) {
          match = and(eq(PipelineStageSchema.name, stage));
        }
        const pipelines = await db.query.PipelineStageSchema.findMany({
          ...(match ? { where: match } : {}),
          orderBy: (PipelineStageSchema, { asc }) =>
            asc(PipelineStageSchema.order),
          with: {
            deals: {
              where: and(
                ...[
                  eq(deals.closeStatus, "ongoing"),
                  ...(owner ? [eq(deals.assignedTo, owner as string)] : []),
                ]
              ),
              with: {
                company: true,
              },
            },
          },
        });
        return pipelines;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occured while fetching pipelines",
        });
      }
    }),
});
