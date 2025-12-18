import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { eq, or, desc } from "drizzle-orm";
import { calls, leads, callOutcomes } from "~/db/schema";
import { TRPCError } from "@trpc/server";

const createCallSchema = z.object({
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  contactId: z.string().min(1, "Contact is required"),
  outcomeId: z.string().optional(),
  type: z.enum(["call", "whatsapp", "email"]).default("call"),
  summary: z.string().min(1, "Summary is required"),
  nextSteps: z.string().min(1, "Next steps are required"),
  dueDateTime: z.string().optional(),
  isDraft: z.boolean().default(false),
});

export const callsRouter = createTRPCRouter({
  // List calls for a lead or deal
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/calls" } })
    .input(
      z.object({
        leadId: z.string().optional(),
        dealId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const whereConditions = [];

        if (input.leadId) {
          whereConditions.push(eq(calls.leadId, input.leadId));
        }
        if (input.dealId) {
          whereConditions.push(eq(calls.dealId, input.dealId));
        }

        if (whereConditions.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either leadId or dealId is required",
          });
        }

        const callsList = await db.query.calls.findMany({
          where:
            whereConditions.length > 1
              ? or(...whereConditions)
              : whereConditions[0],
          with: {
            contact: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            outcome: true,
            creator: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [desc(calls.createdAt)],
        });

        // Transform data to match expected format
        return callsList.map((call) => ({
          id: call.id,
          type: call.type,
          status: call.isDraft ? "draft" : call.status,
          summary: call.summary,
          nextSteps: call.nextSteps,
          dueDateTime: call.dueDateTime,
          createdAt: call.createdAt,
          person: call.contact
            ? {
                id: call.contact.id,
                name: `${call.contact.firstName} ${call.contact.lastName}`,
              }
            : null,
          outcomeTag: call.outcome
            ? {
                text: call.outcome.name,
                variant: call.outcome.variant,
              }
            : null,
        }));
      } catch (error) {
        console.error("Error fetching calls:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch calls",
        });
      }
    }),

  // Create a new call
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/calls" } })
    .input(createCallSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [call] = await db.transaction(async (tx) => {
          const new_calls = tx
            .insert(calls)
            .values({
              leadId: input.leadId || null,
              dealId: input.dealId || null,
              contactId: input.contactId,
              outcomeId: input.outcomeId || null,
              type: input.type,
              summary: input.summary,
              nextSteps: input.nextSteps,
              dueDateTime: input.dueDateTime
                ? new Date(input.dueDateTime)
                : null,
              isDraft: input.isDraft,
              createdBy: ctx.user.id,
            })
            .$returningId();

          if (input.leadId) {
            const lead = await tx.query.leads.findFirst({
              where: eq(leads.id, input.leadId),
            });
            if (lead) {
              await tx
                .update(leads)
                .set({
                  status: lead.status === "new" ? "contacted" : lead.status,
                  lastContactedAt: new Date(),
                })
                .where(eq(leads.id, input.leadId));
            }
          }
          return new_calls;
        });

        return { id: call.id, success: true };
      } catch (error) {
        console.error("Error creating call:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create call",
        });
      }
    }),

  // Get all outcomes
  outcomes: createTRPCRouter({
    list: protectedProcedure
      .meta({ openapi: { method: "GET", path: "/calls/outcomes" } })
      .query(async () => {
      try {
        const outcomes = await db.query.callOutcomes.findMany({
          where: eq(callOutcomes.isActive, true),
          orderBy: (outcomes, { asc }) => [asc(outcomes.name)],
        });

        return outcomes;
      } catch (error) {
        console.error("Error fetching outcomes:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch outcomes",
        });
      }
    }),

    create: protectedProcedure
      .meta({ openapi: { method: "POST", path: "/calls/outcomes" } })
      .input(
        z.object({
          name: z.string().min(1, "Name is required"),
          variant: z.enum(["success", "warning", "default"]).default("default"),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const [outcome] = await db
            .insert(callOutcomes)
            .values({
              name: input.name,
              variant: input.variant,
            })
            .$returningId();

          return { id: outcome.id, success: true };
        } catch (error) {
          console.error("Error creating outcome:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create outcome",
          });
        }
      }),
  }),
});
