//import z from "zod";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { TRPCError } from "@trpc/server";
import { addStakeholdersSchema } from "~/validation/stakeholders";
import { deals, dealStakeholders } from "~/db/schema";
import { NewDealStakeholder } from "~/db/types";
import { calculateDealHealth } from "~/lib/deal-helpers";

export const stakeholdersRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals/{dealId}/stakeholders" } })
    .input(addStakeholdersSchema)
    .mutation(async ({ ctx, input }) => {
      // only the admin, sales agent and sales-manager can perform this action
      // first get the deal to add stakeholders to
      const deal = await db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal to update not found",
        });
      }

      const newStakeholder: NewDealStakeholder = {
        role: input.role,
        dealId: deal.id,
        contactId: input.contactId,
        notes: input.notes,
        lastContactedAt: input.lastContactedAt,
        influence: input.influence,
        sentiment: input.sentiment,
        engaged: input.engaged,
      };
      try {
        const [stakeholder] = await db
          .insert(dealStakeholders)
          .values(newStakeholder);

        await calculateDealHealth({ dealId: deal.id, userId: ctx.user.id });
        return stakeholder;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save stakeholder",
        });
      }
    }),
});
