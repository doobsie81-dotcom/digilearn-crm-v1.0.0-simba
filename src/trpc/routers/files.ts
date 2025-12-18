import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { eq, and, or, desc } from "drizzle-orm";
import { files } from "~/db/schema";
import { TRPCError } from "@trpc/server";
import { put, del } from "@vercel/blob";

const uploadFileSchema = z.object({
  leadId: z.string().optional(),
  dealId: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  originalName: z.string().min(1, "Original name is required"),
  content: z.string(), // base64 encoded file content
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().min(1, "Size is required"),
  type: z.enum(["image", "pdf", "document", "spreadsheet", "other"]),
});

export const filesRouter = createTRPCRouter({
  // Upload a file
  upload: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/files" } })
    .input(uploadFileSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate that either leadId or dealId is provided
        if (!input.leadId && !input.dealId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either leadId or dealId is required",
          });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(input.content, "base64");

        // Upload to Vercel Blob
        const blob = await put(input.name, buffer, {
          access: "public",
          contentType: input.mimeType,
        });

        // Save file metadata to database
        const [file] = await db
          .insert(files)
          .values({
            name: input.name,
            originalName: input.originalName,
            url: blob.url,
            size: input.size,
            mimeType: input.mimeType,
            type: input.type,
            leadId: input.leadId || null,
            dealId: input.dealId || null,
            uploadedBy: ctx.user.id,
          })
          .$returningId();

        return {
          id: file.id,
          url: blob.url,
          success: true,
        };
      } catch (error) {
        console.error("Error uploading file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload file",
        });
      }
    }),

  // List files for a lead or deal
  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/files" } })
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
          whereConditions.push(eq(files.leadId, input.leadId));
        }
        if (input.dealId) {
          whereConditions.push(eq(files.dealId, input.dealId));
        }

        if (whereConditions.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Either leadId or dealId is required",
          });
        }

        const filesList = await db.query.files.findMany({
          where:
            whereConditions.length > 1
              ? or(...whereConditions)
              : whereConditions[0],
          with: {
            uploader: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [desc(files.createdAt)],
        });

        return filesList;
      } catch (error) {
        console.error("Error fetching files:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch files",
        });
      }
    }),

  // Delete a file
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/files/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get file details first
        const file = await db.query.files.findFirst({
          where: eq(files.id, input.id),
        });

        if (!file) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }

        // Delete from Vercel Blob
        await del(file.url);

        // Delete from database
        await db.delete(files).where(eq(files.id, input.id));

        return { success: true };
      } catch (error) {
        console.error("Error deleting file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete file",
        });
      }
    }),

  // Get a single file
  get: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/files/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const file = await db.query.files.findFirst({
          where: eq(files.id, input.id),
          with: {
            uploader: {
              columns: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

        if (!file) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "File not found",
          });
        }

        return file;
      } catch (error) {
        console.error("Error fetching file:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch file",
        });
      }
    }),
});
