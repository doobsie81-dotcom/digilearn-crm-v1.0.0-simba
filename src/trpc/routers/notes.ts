import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { leadActivities, notes, leads } from "~/db/schema";
import { createNoteSchema } from "~/validation/notes";
import { TRPCError } from "@trpc/server";
import { NewNote } from "~/db/types";

export const notesRouter = createTRPCRouter({
  addNote: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/notes" } })
    .input(createNoteSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const [activity] = await db
          .insert(leadActivities)
          .values({
            leadId: input.leadId,
            dealId: input.dealId,
            type: "note",
            status: "completed",
            subject: `New note - by ${ctx.user.name}`,
            scheduledAt: new Date(),
            createdBy: ctx.user.id,
            assignedTo: ctx.user.id,
          })
          .$returningId();

        const newNote: NewNote = {
          content: input.note,
          activityId: activity.id,
          leadId: input.leadId,
          dealId: input.dealId,
          tags: input.tags,
        };

        const [note] = await db.insert(notes).values(newNote).$returningId();

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
          id: note.id,
          activityId: activity.id,
          success: true,
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create note",
        });
      }
    }),
  getDealNotes: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{dealId}/notes" } })
    .input(
      z.object({
        dealId: z.string().min(1, "Deal id is required"),
      })
    )
    .query(async ({ input }) => {
      const dealId = input.dealId;

      const results = await db.query.notes.findMany({
        where: eq(notes.dealId, dealId),
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
        orderBy: (n, { asc }) => [asc(n.createdAt)],
      });

      return results;
    }),
  getLeadNotes: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/notes" } })
    .input(
      z.object({
        leadId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const results = await db.query.notes.findMany({
        where: eq(notes.leadId, input.leadId),
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
        orderBy: (n, { asc }) => [asc(n.createdAt)],
      });

      return results;
    }),
});
