import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { eq, and } from "drizzle-orm";
import { tags, leadTags, dealTags } from "~/db/schema"; 
import { TRPCError } from "@trpc/server";

export const tagsRouter = createTRPCRouter({
  // Create a new tag
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/tags" } })
    .input(
      z.object({
        name: z.string().min(1, "Tag name is required").max(100),
        color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const [tag] = await db
          .insert(tags)
          .values({
            name: input.name,
            color: input.color,
            description: input.description || null,
            createdBy: ctx.user.id,
          })
          .$returningId();

        return { id: tag.id, success: true };
      } catch (error) {
        console.error("Error creating tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create tag",
        });
      }
    }),

  // Get all tags
  getAll: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/tags" } })
    .query(async () => {
    try {
      const allTags = await db.query.tags.findMany({
        orderBy: (tags, { asc }) => [asc(tags.name)],
      });

      return allTags;
    } catch (error) {
      console.error("Error fetching tags:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch tags",
      });
    }
  }),

  // Update a tag
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/tags/{id}" } })
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const updateData = await db.query.tags.findFirst({
          where:eq(tags.id, input.id)
        });
        if(!updateData) {
          throw new TRPCError({code: 'NOT_FOUND', message: "Tag was not found"})
        }
        if (input.name) updateData.name = input.name;
        if (input.color) updateData.color = input.color;
        if (input.description !== undefined) updateData.description = input.description;

        await db.update(tags).set(updateData).where(eq(tags.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error updating tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update tag",
        });
      }
    }),

  // Delete a tag
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/tags/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await db.delete(tags).where(eq(tags.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting tag:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete tag",
        });
      }
    }),

  // Add tag to lead
  addToLead: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/leads/{leadId}/tags" } })
    .input(
      z.object({
        leadId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.insert(leadTags).values({
          leadId: input.leadId,
          tagId: input.tagId,
          addedBy: ctx.user.id,
        });

        return { success: true };
      } catch (error) {
        console.error("Error adding tag to lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add tag to lead",
        });
      }
    }),

  // Remove tag from lead
  removeFromLead: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/leads/{leadId}/tags/{tagId}" } })
    .input(
      z.object({
        leadId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db
          .delete(leadTags)
          .where(
            and(
              eq(leadTags.leadId, input.leadId),
              eq(leadTags.tagId, input.tagId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("Error removing tag from lead:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove tag from lead",
        });
      }
    }),

  // Add tag to deal
  addToDeal: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/deals/{dealId}/tags" } })
    .input(
      z.object({
        dealId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await db.insert(dealTags).values({
          dealId: input.dealId,
          tagId: input.tagId,
          addedBy: ctx.user.id,
        });

        return { success: true };
      } catch (error) {
        console.error("Error adding tag to deal:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to add tag to deal",
        });
      }
    }),

  // Remove tag from deal
  removeFromDeal: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/deals/{dealId}/tags/{tagId}" } })
    .input(
      z.object({
        dealId: z.string(),
        tagId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await db
          .delete(dealTags)
          .where(
            and(
              eq(dealTags.dealId, input.dealId),
              eq(dealTags.tagId, input.tagId)
            )
          );

        return { success: true };
      } catch (error) {
        console.error("Error removing tag from deal:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove tag from deal",
        });
      }
    }),

  // Get lead tags
  getLeadTags: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/tags" } })
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        const leadTagsList = await db.query.leadTags.findMany({
          where: eq(leadTags.leadId, input.leadId),
          with: {
            tag: true,
          },
        });

        return leadTagsList.map((lt) => lt.tag);
      } catch (error) {
        console.error("Error fetching lead tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch lead tags",
        });
      }
    }),

  // Get deal tags
  getDealTags: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/deals/{dealId}/tags" } })
    .input(z.object({ dealId: z.string() }))
    .query(async ({ input }) => {
      try {
        const dealTagsList = await db.query.dealTags.findMany({
          where: eq(dealTags.dealId, input.dealId),
          with: {
            tag: true,
          },
        });

        return dealTagsList.map((dt) => dt.tag);
      } catch (error) {
        console.error("Error fetching deal tags:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch deal tags",
        });
      }
    }),
});
