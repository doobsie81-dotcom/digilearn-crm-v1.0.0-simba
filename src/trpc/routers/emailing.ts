import { TRPCError } from "@trpc/server";
import z from "zod";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/trpc/init";
import {
  sendEmail,
  getSentMessages,
  getDraftMessages,
} from "~/lib/microsoft-graph-email";
import { sendEmailSchema } from "~/validation/emails";
import { emails } from "~/db/schema/emails-schema";
import { leadActivities } from "~/db/schema/leads-schema";
import { v4 as uuidv4 } from "uuid";

export const emailsRouter = createTRPCRouter({
  getAuthUrl: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/emails/auth-url" } })
    .query(async () => {
    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
      response_type: "code",
      scope: "Mail.Send Mail.Read Mail.ReadWrite offline_access",
      prompt: "select_account",
    });
    return `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize?${params.toString()}`;
  }),
  getAccessToken: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/emails/access-token" } })
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.MICROSOFT_CLIENT_ID!,
              client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
              code: input.code,
              redirect_uri: process.env.MICROSOFT_REDIRECT_URI!,
              grant_type: "authorization_code",
              scope: "Mail.Send Mail.Read Mail.ReadWrite offline_access",
            }).toString(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error_description || "Failed to get access token"
          );
        }
        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        };
      } catch (error) {
        console.log(error);
        throw new Error("Failed to get access token");
      }
    }),

  // Refresh access token using refresh token
  refreshAccessToken: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/emails/refresh-token" } })
    .input(z.object({ refreshToken: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: process.env.MICROSOFT_CLIENT_ID!,
              client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
              refresh_token: input.refreshToken,
              grant_type: "refresh_token",
              scope: "Mail.Send Mail.Read Mail.ReadWrite offline_access",
            }).toString(),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error_description || "Failed to refresh token");
        }

        return {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresIn: data.expires_in,
        };
      } catch (error) {
        console.log(error);
        throw new Error("Failed to refresh access token");
      }
    }),

  // Send email via Microsoft Graph with ACID design
  sendEmailViaGraph: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/emails/send" } })
    .input(sendEmailSchema)
    .mutation(async ({ input, ctx }) => {
      const connection = await db.transaction(async (tx) => {
        try {
          // Step 1: Create activity record if leadId is provided
          let activityId: string | undefined;

          if (input.leadId) {
            activityId = uuidv4();
            await tx.insert(leadActivities).values({
              id: activityId,
              leadId: input.leadId,
              dealId: input.dealId,
              type: "email",
              subject: input.subject,
              scheduledAt: new Date(),
              status: "scheduled",
              createdBy: ctx.user.id || "system",
              assignedTo: ctx.user.id,
            });
          }

          // Step 2: Send email via Microsoft Graph
          await sendEmail({
            from: input.from,
            to: input.to,
            cc: input.cc,
            bcc: input.bcc,
            subject: input.subject,
            body: input.body,
            isHtml: input.isHtml,
            importance: input.importance,
            attachments: input.attachments,
          });

          // Step 3: Log email in database if leadId provided
          if (input.leadId && activityId) {
            await tx.insert(emails).values({
              id: uuidv4(),
              activityId,
              leadId: input.leadId,
              dealId: input.dealId,
              composerId: ctx.user.id,
              subject: input.subject,
              body: input.body,
              recipients: JSON.stringify(input.to),
            });
          }

          // Step 4: Update activity result to sent
          if (input.leadId && activityId) {
            await tx
              .update(leadActivities)
              .set({ status: "completed", completedAt: new Date() })
              .where(eq(leadActivities.id, activityId));
          }

          return { success: true, message: "Email sent successfully" };
        } catch (error) {
          // Transaction will auto-rollback on error
          console.error("Error sending email:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              error instanceof Error ? error.message : "Failed to send email",
          });
        }
      });

      return connection;
    }),

  // Get sent emails via Microsoft Graph
  getSentEmails: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/emails/sent" } })
    .input(
      z.object({
        userEmail: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const messages = await getSentMessages(input.userEmail, input.limit);
        return messages;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch sent emails",
        });
      }
    }),

  // Get draft emails via Microsoft Graph
  getDraftEmails: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/emails/drafts" } })
    .input(
      z.object({
        userEmail: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const messages = await getDraftMessages(input.userEmail);
        return messages;
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch draft emails",
        });
      }
    }),

  // Send email via Outlook
  sendEmail: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/emails/send-outlook" } })
    .input(
      z.object({
        accessToken: z.string(),
        to: z.array(z.string()),
        subject: z.string(),
        body: z.string(),
        isHtml: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(
          "https://graph.microsoft.com/v1.0/me/sendMail",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${input.accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                subject: input.subject,
                body: {
                  contentType: input.isHtml ? "HTML" : "text",
                  content: input.body,
                },
                toRecipients: input.to.map((email) => ({
                  emailAddress: { address: email },
                })),
              },
              saveToSentItems: true,
            }),
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send email",
          });
        }

        return { success: true, message: "Email sent successfully" };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to send email",
        });
      }
    }),

  // Get emails from inbox
  getEmails: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/emails/inbox" } })
    .input(
      z.object({
        accessToken: z.string(),
        limit: z.number().optional().default(10),
      })
    )
    .query(async ({ input }) => {
      try {
        const response = await fetch(
          `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=${input.limit}`,
          {
            headers: {
              Authorization: `Bearer ${input.accessToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to fetch emails",
          });
        }

        const data = await response.json();

        return data.value.map(
          (email: {
            id: string;
            from: { emailAddress: { address: string } };
            subject: string;
            receivedDateTime: string;
            isRead: boolean;
            bodyPreview: string;
          }) => ({
            id: email.id,
            from: email.from.emailAddress.address,
            subject: email.subject,
            receivedDateTime: email.receivedDateTime,
            isRead: email.isRead,
            bodyPreview: email.bodyPreview,
          })
        );
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch emails",
        });
      }
    }),
});
