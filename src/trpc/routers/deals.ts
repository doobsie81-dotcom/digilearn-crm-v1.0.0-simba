import z from "zod";
import { db } from "~/db";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { TRPCError } from "@trpc/server";
import {
  calculateDealHealth,
  getDealHealth,
  //getDealHealthTrend,
} from "~/lib/deal-helpers";
import {
  adddeals,
  dealsBulkUpdate,
  updateStageSchema,
} from "~/validation/deals";
import {
  deals,
  dealStageHistorySchema,
  leads,
  PipelineStageSchema,
  user,
  dealCompetitors,
  companies,
  closeStatusEnum,
} from "~/db/schema";
import { NewDeal, NewDealCompetitor, User } from "~/db/types";
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import {
  addDays,
  differenceInBusinessDays,
  endOfDay,
  startOfDay,
} from "date-fns";
import { QuoteService } from "../services/quotes";
import { generateDocumentNumber } from "~/lib/generators";
import { can, getUserPermissions } from "~/lib/get-user-permissions";
import { subject } from "@casl/ability";

export const dealsRouter = createTRPCRouter({
  calculateDealHealth: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals/{id}/calculate-health" } })
    .input(z.string())
    .mutation(async (opts) => {
      const id = opts.input;
      const userId = opts.ctx.userId;

      return await calculateDealHealth({ dealId: id, userId });
    }),
  getArchivedDeals: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/archived" } })
    .input(
      z.object({
        closeStatus: z.array(z.enum(closeStatusEnum)),
        fromDate: z.string(),
        toDate: z.string(),
        search: z.string().nullish(),
      })
    )
    .query(async (opts) => {
      const { input } = opts;
      const conditions = [inArray(deals.closeStatus, input.closeStatus)];
      if (input.fromDate) {
        conditions.push(
          gte(deals.actualCloseDate, startOfDay(new Date(input.fromDate)))
        );
      }
      if (input.toDate) {
        conditions.push(
          lte(deals.actualCloseDate, endOfDay(new Date(input.toDate)))
        );
      }

      if (input.search) {
        // search with company name, or deal title
      }

      const result = await db.query.deals.findMany({
        where: and(...conditions),
        with: {
          company: true,
        },
      });

      return result;
    }),
  getDealHealth: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{id}/health" } })
    .input(z.string())
    .query(async (opts) => {
      const id = opts.input;

      return await getDealHealth(id);
    }),
  createDeal: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals" } })
    .input(adddeals)
    .mutation(async (opts) => {
      try {
        const input = opts.input;
        const userId = opts.ctx.userId;
        const ctxUser = opts.ctx.user;

        // Use a transaction to ensure ACID semantics for deal + related records
        const created = await db.transaction(async (tx) => {
          // Create the main deal record.
          // Adjust the mapped fields below to match your Prisma/DB schema.
          const lead = await tx.query.leads.findFirst({
            where: eq(leads.id, input.leadId),
            with: {
              primaryContact: {
                columns: {
                  firstName: true,
                  lastName: true,
                  id: true,
                  email: true,
                },
              },
            },
          });

          const abilities = await getUserPermissions(
            ctxUser,
            opts.ctx.userPermissions
          );

          if (!lead) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing lead, or lead not found",
            });
          }

          const allowed = can(abilities, "update", subject("Lead", lead));

          // If user is not allowed to view other leads, they MUST specify their own ID
          if (!allowed && !userId) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You must specify your own user ID to update leads",
            });
          }

          // update lead to converted.
          await tx
            .update(leads)
            .set({ status: "converted" })
            .where(eq(leads.id, lead.id))
            .execute();

          const company = await tx.query.companies.findFirst({
            where: eq(companies.id, lead.companyId),
          });

          if (!company) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing company, or company not found",
            });
          }

          const currentStage = await tx.query.PipelineStageSchema.findFirst({
            where: eq(PipelineStageSchema.id, input.currentStageId),
          });

          if (!currentStage) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Missing current stage, or current stage not found",
            });
          }

          let assignedTo: User | undefined;

          if (input.assignedTo) {
            assignedTo = await tx.query.user.findFirst({
              where: eq(user.id, input.assignedTo),
            });

            if (!assignedTo) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Assigned user was  not found",
              });
            }
          }

          // get the highest position
          const highestPositionTask = await db.query.deals.findFirst({
            where: eq(deals.currentStageId, currentStage.id),
            orderBy: (deal, { asc }) => asc(deal.position),
          });
          // now calculate position
          const position = highestPositionTask
            ? highestPositionTask.position + 1000
            : 1000;

          const dealData: NewDeal = {
            title: input.title,
            description: input.description ?? null,
            value: input.value.toString() ?? "0",
            currentStageId: currentStage.id,
            currentStatus: currentStage.name,
            leadId: lead.id,
            companyId: company.id,
            probability:
              input.probability || currentStage.stageProbability || 0,
            position,
            expectedCloseDate: input.expectedCloseDate,
            assignedTo: assignedTo ? assignedTo.id : null,
            assignedToEmail: assignedTo ? assignedTo.email : null,
          };

          const [deal] = await tx.insert(deals).values(dealData).$returningId();

          // we track the deal stage here...
          await tx.insert(dealStageHistorySchema).values({
            dealId: deal.id,
            toStatus: currentStage.name,
            movedBy: ctxUser?.email,
            movedById: userId!,
            timeInStage: 0,
          });

          // If competitors are provided, create them linked to the deal.
          // Replace `dealCompetitor` and field names to match your DB model.
          if (
            Array.isArray(input.competitors) &&
            input.competitors.length > 0
          ) {
            const competitors = input.competitors.map((c) => ({
              dealId: deal.id,
              competitorStrength: c.competitorStrength ?? null,
              competitorName: c.competitorName,
              status: "active",
              identifiedAt: new Date(),
            })) as NewDealCompetitor[];

            await tx.insert(dealCompetitors).values(competitors);
          }

          if (input?.items && input.items?.length > 0) {
            // then we create a quote for this deal
            const quoteNumber = generateDocumentNumber("INV");
            const dealQuote = await QuoteService.createQuote(tx, {
              quoteNumber,
              personId: lead.primaryContact.id,
              dealId: deal.id,
              clientId: company.id,
              clientName: `${lead.primaryContact.firstName} ${lead.primaryContact.lastName}`,
              clientEmail: lead.primaryContact.email,
              clientAddress: "",
              validUntil: addDays(new Date(), 14),
              items: input.items,
            });

            //  we're supposed to update the new deal value
            // this is a fallback in the case that the input.value is not posted.
            // we'll make sure the deal value is correct
            await tx
              .update(deals)
              .set({ value: dealQuote.total })
              .where(eq(deals.id, deal.id));
          }

          // Calculate initial deal health using existing helper.
          // we need to post the correct transaction here incase of an error
          // await calculateDealHealth({
          //   dealId: deal.id,
          //   userId: ctxUser.id!,
          // });

          // Return the created deal (fresh fetch with any relations if desired)
          return tx.query.deals.findFirst({
            where: eq(deals.id, deal.id),
          });
        });

        return created;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the deal.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
  getDealDetails: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{id}" } })
    .input(z.string())
    .query(async (opts) => {
      const dealId = opts.input;

      try {
        // to add ites for deal valuation
        const deal = await db.query.deals.findFirst({
          where: eq(deals.id, dealId),
          with: {
            company: true,
            quote: true,
            invoice: true,
            lead: {
              with: {
                primaryContact: true,
                contactAssociations: {
                  with: {
                    contact: true,
                  },
                },
              },
            },
            assignedTo: true,
            stageHistory: true,
            healthHistory: true,
            stakeholders: {
              with: {
                contact: {
                  columns: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            competitors: true,
            ///violations: true
          },
        });

        if (!deal) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Deal not found",
          });
        }

        return deal;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching deal details.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/deals/{id}" } })
    .input(
      z.object({
        id: z.string(),
        deal: adddeals.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, deal } = input;
      const dealToUpdate = await db.query.deals.findFirst({
        where: eq(deals.id, id),
      });
      if (!dealToUpdate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deal not found",
        });
      }

      const isUpdatingStatus =
        dealToUpdate.currentStageId !== deal.currentStageId;
      let position = dealToUpdate.position;

      if (isUpdatingStatus && deal?.currentStageId) {
        // get the highest position in the new stage (to place at bottom)
        const highestPositionDeal = await db.query.deals.findFirst({
          where: eq(deals.currentStageId, deal.currentStageId),
          orderBy: (deal, { desc }) => desc(deal.position),
        });
        // now calculate position - add 1000 to place at bottom
        position = highestPositionDeal
          ? highestPositionDeal.position + 1000
          : 1000;
      }
      // find deal to update.
      // check if we have updated its status
      // update deal (also update deal position if it is a status update)
      // update old stage, and insert new if it is a status update.
      const dealUpdateResult = await db.transaction(async (tx) => {
        const pipeline = await db.query.PipelineStageSchema.findFirst({
          where: eq(
            PipelineStageSchema.id,
            isUpdatingStatus
              ? (deal.currentStageId ?? "")
              : dealToUpdate.currentStageId
          ),
        });

        if (!pipeline) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deal not found",
          });
        }

        const newDeal: Partial<NewDeal> = {
          ...dealToUpdate,
          ...deal,
          position,
          probability: pipeline
            ? pipeline?.stageProbability
            : dealToUpdate.probability,
          value: deal?.value ? deal.value.toString() : dealToUpdate.value,
        };

        const updatedDeal = await tx
          .update(deals)
          .set(newDeal)
          .where(eq(deals.id, id));

        await calculateDealHealth({ dealId: id, userId: ctx.user.id });

        if (isUpdatingStatus && deal?.currentStageId) {
          // update old stage history
          await tx
            .update(dealStageHistorySchema)
            .set({
              timeInStage: differenceInBusinessDays(
                new Date(),
                dealToUpdate.currentStageSince
              ),
              slaDeadlineWas: addDays(
                dealToUpdate.currentStageSince,
                pipeline.slaDays ?? 0
              ),
            })
            .where(
              and(
                eq(dealStageHistorySchema.id, id),
                eq(dealStageHistorySchema.toStatus, dealToUpdate.currentStatus)
              )
            );

          // record movement
          await tx.insert(dealStageHistorySchema).values({
            dealId: id,
            fromStatus: dealToUpdate.currentStatus,
            toStatus: pipeline.name,
            movedById: ctx.user.id,
            movedBy: ctx.user.email,
            movedAt: new Date(),
            timeInStage: 0,
          });

          return updatedDeal;
        }
      });
      return dealUpdateResult;
    }),
  closeDeal: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals/{id}/close" } })
    .input(
      z.object({
        id: z.string(),
        deal: z.object({
          closeStatus: z.enum(closeStatusEnum),
          lostReason: z.string().optional(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { id, deal } = input;
      const dealToUpdate = await db.query.deals.findFirst({
        where: eq(deals.id, id),
      });
      if (!dealToUpdate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Deal not found",
        });
      }

      const updatedDeal = await db
        .update(deals)
        .set({
          closeStatus: deal.closeStatus,
          lostReason: deal.lostReason,
          actualCloseDate: new Date(),
        })
        .where(eq(deals.id, id));

      return updatedDeal;
    }),
  addAssignee: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals/{id}/assignee" } })
    .input(
      z.object({
        id: z.string(),
        assignee: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // only admin and sales-agent can assign
      const sessUser = ctx.user;
      if (sessUser.role !== "admin" && sessUser.role !== "sales-manager") {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized",
        });
      }

      // now find the user
      const agent = await db.query.user.findFirst({
        where: eq(user.id, input.assignee),
      });
      if (!agent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sales Agent was not found",
        });
      }

      // now look up the deal
      const deal = await db.query.deals.findFirst({
        where: eq(deals.id, input.id),
      });
      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal was not found",
        });
      }

      // now we save the deal...
      await db
        .update(deals)
        .set({
          assignedTo: agent.id,
          assignedToEmail: agent.email,
        })
        .where(eq(deals.id, input.id));

      return true;
    }),
  bulkUpdate: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/deals/bulk" } })
    .input(dealsBulkUpdate)
    .mutation(async ({ ctx, input }) => {
      const dealsPayload = input.deals;
      try {
        const dealsToUpdate = await db.query.deals.findMany({
          where: inArray(
            deals.id,
            dealsPayload.map((deal) => deal.id)
          ),
        });

        // Check permissions
        const isAdmin = ctx.user.role === "admin";
        const isSalesManager = ctx.user.role === "sales-manager";

        const isAssigned = dealsToUpdate.some(
          (deal) => deal.assignedTo === ctx.user.id
        );

        if (!isAdmin && !isSalesManager && !isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this deal",
          });
        }

        const updatedDeals = await db.transaction(async (tx) => {
          return dealsPayload.map(async (deal) => {
            const { status, id, position } = deal;
            const pipeline = await tx.query.PipelineStageSchema.findFirst({
              where: eq(PipelineStageSchema.name, status),
            });
            const currentDeal = await tx.query.deals.findFirst({
              where: eq(deals.id, id),
            });
            if (!pipeline || !currentDeal) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Pipeline or Deal not found",
              });
            }

            const newDeal: Partial<NewDeal> = {
              currentStatus: status,
              currentStageId: pipeline.id,
              currentStageSince:
                currentDeal.currentStageId === pipeline.id
                  ? currentDeal.currentStageSince
                  : new Date(),
              position,
              probability: pipeline.stageProbability,
            };

            const updatedDeal = await tx
              .update(deals)
              .set(newDeal)
              .where(eq(deals.id, id));

            await calculateDealHealth({ dealId: id, userId: ctx.user.id });

            if (currentDeal.currentStageId !== pipeline.id) {
              // update old stage history
              await tx
                .update(dealStageHistorySchema)
                .set({
                  timeInStage: differenceInBusinessDays(
                    new Date(),
                    currentDeal.currentStageSince
                  ),
                  slaDeadlineWas: addDays(
                    currentDeal.currentStageSince,
                    pipeline.slaDays ?? 0
                  ),
                })
                .where(
                  and(
                    eq(dealStageHistorySchema.id, id),
                    eq(
                      dealStageHistorySchema.toStatus,
                      currentDeal.currentStatus
                    )
                  )
                );

              // record movement
              await tx.insert(dealStageHistorySchema).values({
                dealId: id,
                fromStatus: currentDeal.currentStatus,
                toStatus: pipeline.name,
                movedById: ctx.user.id,
                movedBy: ctx.user.email,
                movedAt: new Date(),
                timeInStage: 0,
              });
            }

            return updatedDeal;
          });
        });

        return { data: updatedDeals };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the deal.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
  updateStage: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/deals/update-stage" } })
    .input(updateStageSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, status } = input;
      try {
        const dealToUpdate = await db.query.deals.findFirst({
          where: eq(deals.id, id),
        });

        if (!dealToUpdate) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Deal not found",
          });
        }

        // Check permissions
        const isAdmin = ctx.user.role === "admin";
        const isSalesManager = ctx.user.role === "sales-manager";

        const isAssigned = dealToUpdate.assignedTo === ctx.user.id;

        if (!isAdmin && !isSalesManager && !isAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Not authorized to update this deal",
          });
        }

        const updatedDeal = await db.transaction(async (tx) => {
          const pipeline = await tx.query.PipelineStageSchema.findFirst({
            where: eq(PipelineStageSchema.id, status),
          });

          const currentDeal = await tx.query.deals.findFirst({
            where: eq(deals.id, id),
          });

          if (!pipeline || !currentDeal) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Pipeline or Deal not found",
            });
          }

          // Calculate position based on the highest position in the target stage
          const highestPositionDeal = await tx.query.deals.findFirst({
            where: eq(deals.currentStageId, pipeline.id),
            orderBy: (deal, { desc }) => desc(deal.position),
          });

          const position = highestPositionDeal
            ? highestPositionDeal.position + 1000
            : 1000;

          const newDeal: Partial<NewDeal> = {
            currentStatus: status,
            currentStageId: pipeline.id,
            currentStageSince:
              currentDeal.currentStageId === pipeline.id
                ? currentDeal.currentStageSince
                : new Date(),
            position,
            probability: pipeline.stageProbability,
          };

          const updatedDeal = await tx
            .update(deals)
            .set(newDeal)
            .where(eq(deals.id, id));

          if (currentDeal.currentStageId !== pipeline.id) {
            // update old stage history
            await tx
              .update(dealStageHistorySchema)
              .set({
                timeInStage: differenceInBusinessDays(
                  new Date(),
                  currentDeal.currentStageSince
                ),
                slaDeadlineWas: addDays(
                  currentDeal.currentStageSince,
                  pipeline.slaDays ?? 0
                ),
              })
              .where(
                and(
                  eq(dealStageHistorySchema.id, id),
                  eq(dealStageHistorySchema.toStatus, currentDeal.currentStatus)
                )
              );

            // record movement
            await tx.insert(dealStageHistorySchema).values({
              dealId: id,
              fromStatus: currentDeal.currentStatus,
              toStatus: pipeline.name,
              movedById: ctx.user.id,
              movedBy: ctx.user.email,
              movedAt: new Date(),
              timeInStage: 0,
            });
          }

          return updatedDeal;
        });

        return { data: updatedDeal };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while creating the deal.",
          cause: error instanceof Error ? error : undefined,
        });
      }
    }),
});
