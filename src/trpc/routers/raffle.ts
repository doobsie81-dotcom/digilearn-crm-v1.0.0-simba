import { TRPCError } from "@trpc/server";
import { and, eq, gte, lte, desc, sql, like, count } from "drizzle-orm";
import { db } from "~/db";
import { raffles, raffleEntries, leads, companies, contacts } from "~/db/schema";
import { createTRPCRouter, baseProcedure, protectedProcedure } from "~/trpc/init";
import {
  createRaffleSchema,
  updateRaffleSchema,
  enterRaffleSchema,
  getRaffleSchema,
  listRafflesSchema,
} from "~/validation/raffle";
import z from "zod";

export const raffleRouter = createTRPCRouter({
  // Public endpoint to create raffle entry
  enter: baseProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/public/raffle/enter",
        protect: false,
      }
    })
    .input(enterRaffleSchema)
    .mutation(async ({ input }) => {
      const { raffleId, leadId } = input;

      // Check if raffle exists and is active
      const raffle = await db.query.raffles.findFirst({
        where: eq(raffles.id, raffleId),
      });

      if (!raffle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raffle not found",
        });
      }

      const now = new Date();
      if (now < raffle.startDate || now > raffle.endDate) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Raffle is not currently active",
        });
      }

      // Check if lead exists
      const lead = await db.query.leads.findFirst({
        where: eq(leads.id, leadId),
      });

      if (!lead) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Lead not found",
        });
      }

      // Check if lead already entered this raffle
      const existingEntry = await db.query.raffleEntries.findFirst({
        where: and(
          eq(raffleEntries.raffleId, raffleId),
          eq(raffleEntries.leadId, leadId)
        ),
      });

      if (existingEntry) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lead has already entered this raffle",
        });
      }

      // Get the next ticket number for this raffle
      const [maxTicket] = await db
        .select({ maxTicket: sql<number>`COALESCE(MAX(${raffleEntries.ticketNumber}), 0)` })
        .from(raffleEntries)
        .where(eq(raffleEntries.raffleId, raffleId));

      const nextTicketNumber = (maxTicket?.maxTicket ?? 0) + 1;

      // Create entry
      const [entry] = await db
        .insert(raffleEntries)
        .values({
          raffleId,
          leadId,
          ticketNumber: nextTicketNumber,
        })
        .$returningId();

      return {
        id: entry.id,
        ticketNumber: nextTicketNumber,
        message: `Successfully entered! Your ticket number is ${nextTicketNumber}`,
      };
    }),

  // Public endpoint to list active raffles
  listActive: baseProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/public/raffle/active",
        protect: false,
      }
    })
    .query(async () => {
      const now = new Date();

      const activeRaffles = await db.query.raffles.findMany({
        where: and(
          lte(raffles.startDate, now),
          gte(raffles.endDate, now)
        ),
        orderBy: [desc(raffles.startDate)],
      });

      return activeRaffles;
    }),

  // Public endpoint to get raffle details
  getPublic: baseProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/public/raffle/{id}",
        protect: false,
      }
    })
    .input(getRaffleSchema)
    .query(async ({ input }) => {
      const raffle = await db.query.raffles.findFirst({
        where: eq(raffles.id, input.id),
        with: {
          entries: {
            with: {
              lead: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!raffle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raffle not found",
        });
      }

      return {
        ...raffle,
        totalEntries: raffle.entries.length,
        isActive: new Date() >= raffle.startDate && new Date() <= raffle.endDate,
      };
    }),

  // Protected endpoints for admin management
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/raffle" } })
    .input(createRaffleSchema)
    .mutation(async ({ input }) => {
      const [raffle] = await db
        .insert(raffles)
        .values({
          title: input.title,
          location: input.location,
          startDate: input.startDate,
          endDate: input.endDate,
        })
        .$returningId();

      return { id: raffle.id };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/raffle/{id}" } })
    .input(updateRaffleSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const existing = await db.query.raffles.findFirst({
        where: eq(raffles.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raffle not found",
        });
      }

      await db
        .update(raffles)
        .set(updateData)
        .where(eq(raffles.id, id));

      return { success: true };
    }),

  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/raffle" } })
    .input(listRafflesSchema)
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.active) {
        const now = new Date();
        conditions.push(
          and(
            lte(raffles.startDate, now),
            gte(raffles.endDate, now)
          )
        );
      }

      const allRaffles = await db.query.raffles.findMany({
        where: conditions.length ? and(...conditions) : undefined,
        orderBy: [desc(raffles.createdAt)],
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        with: {
          entries: true,
        },
      });

      return allRaffles.map((raffle) => ({
        ...raffle,
        totalEntries: raffle.entries.length,
        isActive: new Date() >= raffle.startDate && new Date() <= raffle.endDate,
      }));
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/raffle/{id}" } })
    .input(getRaffleSchema)
    .query(async ({ input }) => {
      const raffle = await db.query.raffles.findFirst({
        where: eq(raffles.id, input.id),
        with: {
          entries: {
            with: {
              lead: {
                with: {
                  company: true,
                  primaryContact: true,
                },
              },
            },
            orderBy: [desc(raffleEntries.entryDate)],
          },
        },
      });

      if (!raffle) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raffle not found",
        });
      }

      return {
        ...raffle,
        totalEntries: raffle.entries.length,
        isActive: new Date() >= raffle.startDate && new Date() <= raffle.endDate,
      };
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/raffle/{id}" } })
    .input(getRaffleSchema)
    .mutation(async ({ input }) => {
      const existing = await db.query.raffles.findFirst({
        where: eq(raffles.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Raffle not found",
        });
      }

      await db.delete(raffles).where(eq(raffles.id, input.id));

      return { success: true };
    }),

  // Get entries for a specific raffle
  getEntries: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/raffle/{id}/entries" } })
    .input(getRaffleSchema)
    .query(async ({ input }) => {
      const entries = await db.query.raffleEntries.findMany({
        where: eq(raffleEntries.raffleId, input.id),
        with: {
          lead: {
            with: {
              company: true,
              primaryContact: true,
            },
          },
        },
        orderBy: [raffleEntries.ticketNumber],
      });

      return entries;
    }),

  // Dashboard endpoint for raffle leads
  getRaffleLeadsDashboard: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/raffle/leads/dashboard" } })
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { search, limit, offset } = input;

      // Get all lead IDs that have raffle entries
      const raffleLeadIds = await db
        .selectDistinct({ leadId: raffleEntries.leadId })
        .from(raffleEntries);

      const leadIdsList = raffleLeadIds.map((r) => r.leadId);

      if (leadIdsList.length === 0) {
        return {
          total: 0,
          leads: [],
          pagination: {
            limit,
            offset,
            hasMore: false,
          },
        };
      }

      // Build where conditions
      let whereCondition;
      if (search) {
        // Get leads that match the search and are in raffle
        const matchingCompanies = await db
          .select({ id: companies.id })
          .from(companies)
          .where(like(companies.name, `%${search}%`));

        const companyIds = matchingCompanies.map((c) => c.id);

        whereCondition = and(
          sql`${leads.id} IN (${sql.join(leadIdsList.map((id) => sql`${id}`), sql`, `)})`,
          companyIds.length > 0
            ? sql`${leads.companyId} IN (${sql.join(companyIds.map((id) => sql`${id}`), sql`, `)})`
            : sql`1=0`
        );
      } else {
        whereCondition = sql`${leads.id} IN (${sql.join(leadIdsList.map((id) => sql`${id}`), sql`, `)})`;
      }

      // Get total count
      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(leads)
        .where(whereCondition);

      const total = Number(totalResult?.count ?? 0);

      // Get paginated leads
      const raffleLeads = await db.query.leads.findMany({
        where: whereCondition,
        with: {
          company: true,
          primaryContact: true,
          qualification: true,
        },
        orderBy: [desc(leads.createdAt)],
        limit,
        offset,
      });

      return {
        total,
        leads: raffleLeads,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    }),
});
