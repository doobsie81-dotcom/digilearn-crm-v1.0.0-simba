import z from "zod";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { eq } from "drizzle-orm";
import {
  leadQualificationCriteria,
  leads,
  planTypeEnum,
  timelineTypeEnum,
  budgetIndicatorEnum,
} from "~/db/schema";
import { LeadQualificationCriteria } from "~/db/types";
import { TRPCError } from "@trpc/server";

// Validation schemas
const updateQualificationSchema = z.object({
  leadId: z.string(),
  needs: z.string().optional(),
  planType: z.enum(planTypeEnum).optional(),
  timelineType: z.enum(timelineTypeEnum).optional(),
  specificDate: z.string().optional(),
  budgetIndicator: z.enum(budgetIndicatorEnum).optional(),
  budgetAmount: z.string().optional(),
  phoneVerified: z.boolean().optional(),
  emailVerified: z.boolean().optional(),
  provinceVerified: z.boolean().optional(),
});

// Helper function to calculate completion percentage
function calculateCompletion(criteria: Partial<LeadQualificationCriteria>) {
  const checks = {
    hasInfluentialContact: false,
    hasNeeds: false,
    hasPlanType: false,
    hasTimeline: false,
    hasBudget: false,
    hasVerifiedContact: false,
  };

  // Check for influential contact from lead contacts
  // This would be populated by checking lead.contactAssociations for primary contacts
  checks.hasInfluentialContact = !!criteria?.hasInfluentialContact;

  // Check needs
  checks.hasNeeds = !!(criteria?.needs && criteria?.needs.trim().length > 0);

  // Check plan type
  checks.hasPlanType = !!criteria?.planType;

  // Check timeline
  checks.hasTimeline = !!(
    criteria?.timelineType &&
    (criteria?.timelineType !== "specific-date" || criteria?.specificDate)
  );

  // Check budget
  checks.hasBudget = !!(criteria?.budgetIndicator || criteria?.budgetAmount);

  // Check verified contact (all three must be verified)
  checks.hasVerifiedContact = !!(
    criteria?.phoneVerified ||
    criteria?.emailVerified ||
    criteria?.provinceVerified
  );

  // Calculate percentage (8 total checks)
  const completedCount = Object.values(checks).filter(Boolean).length;
  const percentage = Math.round(
    (completedCount / Object.values(checks).length) * 100
  );

  return {
    ...checks,
    completionPercentage: percentage,
    isQualified: percentage >= 75,
  };
}

export const leadQualificationRouter = createTRPCRouter({
  // Get or create qualification criteria for a lead
  get: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/leads/{leadId}/qualification" } })
    .input(z.object({ leadId: z.string() }))
    .query(async ({ input }) => {
      try {
        // Get lead with contacts to check for influential contacts
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, input.leadId),
          with: {
            contactAssociations: {
              with: {
                contact: true,
              },
            },
          },
        });

        let criteria = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, input.leadId),
        });

        // Check for influential contacts from lead
        const hasInfluential = lead?.contactAssociations?.some(
          (ca) =>
            ca.isPrimary ||
            ["primary", "decision_maker", "financial"].includes(ca.role)
        );

        // Create if doesn't exist
        if (!criteria) {
          const [newCriteria] = await db
            .insert(leadQualificationCriteria)
            .values({
              leadId: input.leadId,
              ...calculateCompletion({
                hasInfluentialContact: hasInfluential || false,
              }),
            })
            .$returningId();

          criteria = await db.query.leadQualificationCriteria.findFirst({
            where: eq(leadQualificationCriteria.id, newCriteria.id),
          });
        } else {
          // Update contact flags if changed
          await db
            .update(leadQualificationCriteria)
            .set({
              ...calculateCompletion({
                ...criteria,
                hasInfluentialContact: hasInfluential || false,
              }),
            })
            .where(eq(leadQualificationCriteria.leadId, input.leadId));

          // Refetch after update
          criteria = await db.query.leadQualificationCriteria.findFirst({
            where: eq(leadQualificationCriteria.leadId, input.leadId),
          });
        }

        return criteria;
      } catch (error) {
        console.error("Error fetching qualification criteria:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch qualification criteria",
        });
      }
    }),

  // Update qualification criteria
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/leads/{leadId}/qualification" } })
    .input(updateQualificationSchema)
    .mutation(async ({ input }) => {
      try {
        const { leadId, specificDate, budgetAmount, ...updateData } = input;

        // First, verify the lead exists
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, leadId),
          with: {
            contactAssociations: {
              with: {
                contact: true,
              },
            },
          },
        });

        if (!lead) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Check for influential contacts
        const hasInfluential = lead.contactAssociations?.some(
          (ca) =>
            ca.isPrimary ||
            ["primary", "decision_maker", "financial"].includes(ca.role)
        );

        // Get existing criteria
        const existing = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, leadId),
        });

        // If no qualification criteria exists, create it
        if (!existing) {
          const dataToInsert = {
            ...updateData,
            specificDate: specificDate ? new Date(specificDate) : undefined,
            budgetAmount: budgetAmount || undefined,
            hasInfluentialContact: hasInfluential || false,
          };

          const completion = calculateCompletion(dataToInsert);

          const [newCriteria] = await db
            .insert(leadQualificationCriteria)
            .values({
              leadId,
              ...dataToInsert,
              ...completion,
            })
            .$returningId();

          // Auto-qualify lead if criteria is met and lead has been contacted
          if (completion.isQualified && lead.lastContactedAt && lead.status === "contacted") {
            await db
              .update(leads)
              .set({
                status: "qualified",
                updatedAt: new Date(),
              })
              .where(eq(leads.id, leadId));
          }

          const created = await db.query.leadQualificationCriteria.findFirst({
            where: eq(leadQualificationCriteria.id, newCriteria.id),
          });

          return created;
        }

        // Merge with existing data
        const merged = {
          ...existing,
          ...updateData,
          specificDate: specificDate
            ? new Date(specificDate)
            : existing.specificDate,
          budgetAmount: budgetAmount || existing.budgetAmount,
          hasInfluentialContact: hasInfluential || existing.hasInfluentialContact,
        };

        // Calculate completion
        const completion = calculateCompletion(merged);

        // Update in database
        await db
          .update(leadQualificationCriteria)
          .set({
            ...updateData,
            specificDate: specificDate ? new Date(specificDate) : undefined,
            budgetAmount: budgetAmount || undefined,
            ...completion,
            updatedAt: new Date(),
          })
          .where(eq(leadQualificationCriteria.leadId, leadId));

        // Auto-qualify lead if criteria is met and lead has been contacted
        if (completion.isQualified && lead.lastContactedAt && lead.status === "contacted") {
          await db
            .update(leads)
            .set({
              status: "qualified",
              updatedAt: new Date(),
            })
            .where(eq(leads.id, leadId));
        }

        // Return updated criteria
        const updated = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, leadId),
        });

        return updated;
      } catch (error) {
        console.error("Error updating qualification criteria:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update qualification criteria",
        });
      }
    }),

   // Update qualification criteria
  updatePublic: baseProcedure
    .meta({ openapi: { method: "PATCH", path: "/leads/{leadId}/qualification" } })
    .input(updateQualificationSchema)
    .mutation(async ({ input }) => {
      try {
        const { leadId, specificDate, budgetAmount, ...updateData } = input;

        // First, verify the lead exists
        const lead = await db.query.leads.findFirst({
          where: eq(leads.id, leadId),
          with: {
            contactAssociations: {
              with: {
                contact: true,
              },
            },
          },
        });

        if (!lead) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Lead not found",
          });
        }

        // Check for influential contacts
        const hasInfluential = lead.contactAssociations?.some(
          (ca) =>
            ca.isPrimary ||
            ["primary", "decision_maker", "financial"].includes(ca.role)
        );

        // Get existing criteria
        const existing = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, leadId),
        });

        // If no qualification criteria exists, create it
        if (!existing) {
          const dataToInsert = {
            ...updateData,
            specificDate: specificDate ? new Date(specificDate) : undefined,
            budgetAmount: budgetAmount || undefined,
            hasInfluentialContact: hasInfluential || false,
          };

          const completion = calculateCompletion(dataToInsert);

          const [newCriteria] = await db
            .insert(leadQualificationCriteria)
            .values({
              leadId,
              ...dataToInsert,
              ...completion,
            })
            .$returningId();

          // Auto-qualify lead if criteria is met and lead has been contacted
          if (completion.isQualified && lead.lastContactedAt && lead.status === "contacted") {
            await db
              .update(leads)
              .set({
                status: "qualified",
                updatedAt: new Date(),
              })
              .where(eq(leads.id, leadId));
          }

          const created = await db.query.leadQualificationCriteria.findFirst({
            where: eq(leadQualificationCriteria.id, newCriteria.id),
          });

          return created;
        }

        // Merge with existing data
        const merged = {
          ...existing,
          ...updateData,
          specificDate: specificDate
            ? new Date(specificDate)
            : existing.specificDate,
          budgetAmount: budgetAmount || existing.budgetAmount,
          hasInfluentialContact: hasInfluential || existing.hasInfluentialContact,
        };

        // Calculate completion
        const completion = calculateCompletion(merged);

        // Update in database
        await db
          .update(leadQualificationCriteria)
          .set({
            ...updateData,
            specificDate: specificDate ? new Date(specificDate) : undefined,
            budgetAmount: budgetAmount || undefined,
            ...completion,
            updatedAt: new Date(),
          })
          .where(eq(leadQualificationCriteria.leadId, leadId));

        // Auto-qualify lead if criteria is met and lead has been contacted
        if (completion.isQualified && lead.lastContactedAt && lead.status === "contacted") {
          await db
            .update(leads)
            .set({
              status: "qualified",
              updatedAt: new Date(),
            })
            .where(eq(leads.id, leadId));
        }

        // Return updated criteria
        const updated = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, leadId),
        });

        return updated;
      } catch (error) {
        console.error("Error updating qualification criteria:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update qualification criteria",
        });
      }
    }),  

  // Recalculate completion for a lead
  recalculate: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/leads/{leadId}/qualification/recalculate" } })
    .input(z.object({ leadId: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const criteria = await db.query.leadQualificationCriteria.findFirst({
          where: eq(leadQualificationCriteria.leadId, input.leadId),
        });

        if (!criteria) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Qualification criteria not found",
          });
        }

        const completion = calculateCompletion(criteria);

        await db
          .update(leadQualificationCriteria)
          .set({
            ...completion,
            updatedAt: new Date(),
          })
          .where(eq(leadQualificationCriteria.leadId, input.leadId));

        return completion;
      } catch (error) {
        console.error("Error recalculating completion:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to recalculate completion",
        });
      }
    }),
});
