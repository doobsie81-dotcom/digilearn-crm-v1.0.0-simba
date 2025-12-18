import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import { events, deals, leadActivities, activityStatusEnum, leads } from "~/db/schema";
import { db } from "~/db";
import { createMeetingSchema, updateMeetingSchema } from "~/validation/events";
import { differenceInHours } from "date-fns";
import { NewEvent } from "~/db/types";

export const eventsRouter = createTRPCRouter({
  schedule: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/events" } })
    .input(createMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      //await checkTeamMembership(ctx.userId, input.leadId);
      const { startDate, endDate } = {
        endDate: new Date(input.endDate),
        startDate: new Date(input.startDate),
      };
      const duration = differenceInHours(endDate, startDate);

      try {
        const [activity] = await db
          .insert(leadActivities)
          .values({
            leadId: input.leadId,
            dealId: input.dealId,
            contactId: input.contactId,
            type: "meeting",
            status: "scheduled",
            subject: input.subject,
            description: input.description,
            scheduledAt: input.scheduledAt,
            duration,
            createdBy: ctx.user.id,
            assignedTo: input.assignedTo || ctx.user.id,
          })
          .$returningId();

        const newEvent: NewEvent = {
          title: input.subject,
          activityId: activity.id,
          leadId: input.leadId,
          dealId: input.dealId,
          location: input.location,
          startDate,
          endDate,
          meetingLink: input.meetingLink,
          platform: input.platform,
          attendees: JSON.stringify(input.attendees || []),
          agenda: input.agenda,
        };

        const [event] = await db.insert(events).values(newEvent).$returningId();

        // Update lead status to "contacted" if this is the first contact
        if (input.leadId) {
          const lead = await db.query.leads.findFirst({
            where: eq(leads.id, input.leadId),
            columns: { status: true, lastContactedAt: true },
          });

          if (lead && lead.status === "new") {
            await db
              .update(leads)
              .set({
                status: "contacted",
                lastContactedAt: new Date(),
              })
              .where(eq(leads.id, input.leadId));
          } else if (lead) {
            // Just update lastContactedAt for existing contacted leads
            await db
              .update(leads)
              .set({ lastContactedAt: new Date() })
              .where(eq(leads.id, input.leadId));
          }
        }

        return {
          id: event.id,
          activityId: activity.id,
          success: true,
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to schedule meeting",
        });
      }
    }),
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/events/{eventId}" } })
    .input(updateMeetingSchema)
    .mutation(async ({ input }) => {
      const meeting = await db.query.events.findFirst({
        where: eq(events.id, input.eventId),
        columns: { leadId: true, activityId: true },
      });

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      // do something here...
    }),
  getLeadMeetings: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/events" } })
    .input(
      z.object({
        leadId: z.string(),
        status: z.enum(activityStatusEnum).nullish(),
        upcomingOnly: z.boolean().nullish(),
      })
    )
    .query(async ({ input }) => {
      const conditions = [eq(events.leadId, input.leadId)];

      if (input.status) {
        conditions.push(eq(leadActivities.status, input.status));
      }

      if (input.upcomingOnly) {
        conditions.push(sql`${leadActivities.scheduledAt} >= NOW()`);
      }

      const meetings = await db.query.events.findMany({
        where: eq(events.leadId, input.leadId), // and(...conditions),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: { id: true, name: true, email: true },
              },
              createdByUser: {
                columns: { id: true, name: true },
              },
            },
          },
        },
        orderBy: (m, { asc }) => [asc(events.startDate)],
      });

      return meetings;
    }),
  getDealMeetings: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{dealId}/events" } })
    .input(
      z.object({
        dealId: z.string(),
        status: z.enum(activityStatusEnum).nullish(),
      })
    )
    .query(async ({ input }) => {
      const deal = await db.query.deals.findFirst({
        where: eq(deals.id, input.dealId),
        columns: { leadId: true },
      });

      if (!deal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const conditions = [eq(leadActivities.dealId, input.dealId)];

      if (input.status) {
        conditions.push(eq(leadActivities.status, input.status));
      }

      const meetings = await db.query.events.findMany({
        where: eq(events.dealId, input.dealId), // and(...conditions),
        with: {
          activity: {
            with: {
              assignedToUser: {
                columns: { id: true, name: true, email: true },
              },
              createdByUser: {
                columns: { id: true, name: true },
              },
            },
          },
        },
        orderBy: (m, { asc }) => [asc(events.startDate)],
      });
      return meetings;
    }),
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/events/{meetingId}" } })
    .input(z.object({ meetingId: z.string() }))
    .mutation(async ({ input }) => {
      const meeting = await db.query.events.findFirst({
        where: eq(events.id, input.meetingId),
        columns: { activityId: true, leadId: true },
      });

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      await db
        .delete(leadActivities)
        .where(eq(leadActivities.id, meeting.activityId));

      return { success: true };
    }),
});
