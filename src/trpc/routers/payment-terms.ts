import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import {
  paymentTerms,
  appliedPaymentTerms,
  paymentTermTypeEnum,
} from "~/db/schema";
import { TRPCError } from "@trpc/server";

// Validation Schemas
const paymentTermSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    type: z.enum(paymentTermTypeEnum),
    interestRate: z.number().min(0).max(100),
    numberOfTerms: z.number().int().min(1).optional(),
    termLengthDays: z.number().int().min(1).optional(),
    daysUntilDue: z.number().int().min(0).optional(),
    termsAndConditions: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    displayOrder: z.number().int().default(0),
  })
  .refine(
    (data) => {
      // Name is required for custom plans
      if (data.type === "custom") {
        return !!data.name && data.name.length >= 2;
      }
      return true;
    },
    {
      message: "Name is required for custom plans",
      path: ["name"],
    }
  );

const updatePaymentTermSchema = paymentTermSchema.partial().extend({
  id: z.string(),
});

// Financial Calculator Input Schema
const calculatorInputSchema = z.object({
  subtotal: z.number().min(0),
  paymentTermId: z.string(),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0).default(0),
});

export const paymentTermsRouter = createTRPCRouter({
  // Get all active payment terms
  getAll: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/payment-terms" } })
    .input(
      z
        .object({
          includeInactive: z.boolean().default(false),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (!input?.includeInactive) {
        conditions.push(eq(paymentTerms.isActive, true));
      }

      const terms = await db.query.paymentTerms.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(paymentTerms.displayOrder)],
      });

      return terms;
    }),

  // Get single payment term
  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/payment-terms/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const term = await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, input.id),
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment term not found",
        });
      }

      return term;
    }),

  // Create payment term
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/payment-terms" } })
    .input(paymentTermSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can create payment terms
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create payment terms",
        });
      }

      // Generate name for predefined types, use provided name for custom
      const typeLabels: Record<string, string> = {
        "cash": "Cash Payment",
        "3-term": "3 Term Plan",
        "4-term": "4 Term Plan",
        "6-term": "6 Term Plan",
        "9-term": "9 Term Plan",
        "custom-date": "Custom Date",
        "net-30": "Net 30 Days",
        "net-60": "Net 60 Days",
        "net-90": "Net 90 Days",
      };

      const name = input.type === "custom"
        ? input.name
        : typeLabels[input.type] || input.type;

      // If this is set as default, unset other defaults
      if (input.isDefault) {
        await db
          .update(paymentTerms)
          .set({ isDefault: false })
          .where(eq(paymentTerms.isDefault, true));
      }

      const [newTerm] = await db
        .insert(paymentTerms)
        .values({
          ...input,
          name,
          interestRate: input.interestRate.toFixed(2),
        })
        .$returningId();

      return await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, newTerm.id),
      });
    }),

  // Update payment term
  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/payment-terms/{id}" } })
    .input(updatePaymentTermSchema)
    .mutation(async ({ input, ctx }) => {
      // Only admins can update payment terms
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update payment terms",
        });
      }

      const { id, ...updateData } = input;

      // Check if term exists
      const existing = await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment term not found",
        });
      }

      // Generate name for predefined types if type is being changed
      const typeLabels: Record<string, string> = {
        "cash": "Cash Payment",
        "3-term": "3 Term Plan",
        "4-term": "4 Term Plan",
        "6-term": "6 Term Plan",
        "9-term": "9 Term Plan",
        "custom-date": "Custom Date",
        "net-30": "Net 30 Days",
        "net-60": "Net 60 Days",
        "net-90": "Net 90 Days",
      };

      const updatedType = updateData.type || existing.type;
      let name = updateData.name;

      // If changing to custom type, keep the provided name
      // If changing from custom to predefined, generate the name
      if (updateData.type && updateData.type !== "custom") {
        name = typeLabels[updateData.type] || updateData.type;
      } else if (updatedType !== "custom" && !updateData.name) {
        name = typeLabels[updatedType] || updatedType;
      }

      // If this is being set as default, unset other defaults
      if (updateData.isDefault) {
        await db
          .update(paymentTerms)
          .set({ isDefault: false })
          .where(eq(paymentTerms.isDefault, true));
      }

      await db
        .update(paymentTerms)
        .set({
          ...updateData,
          name,
          interestRate: updateData.interestRate
            ? updateData.interestRate.toFixed(2)
            : undefined,
          updatedAt: new Date(),
        })
        .where(eq(paymentTerms.id, id));

      return await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, id),
      });
    }),

  // Delete payment term
  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/payment-terms/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete payment terms
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete payment terms",
        });
      }

      const existing = await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment term not found",
        });
      }

      await db.delete(paymentTerms).where(eq(paymentTerms.id, input.id));

      return { success: true };
    }),

  // Financial Calculator - Calculate totals with interest
  calculate: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/payment-terms/calculate" } })
    .input(calculatorInputSchema)
    .mutation(async ({ input }) => {
      const { subtotal, paymentTermId, taxRate, discount } = input;

      // Get payment term
      const term = await db.query.paymentTerms.findFirst({
        where: eq(paymentTerms.id, paymentTermId),
      });

      if (!term) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Payment term not found",
        });
      }

      // Step 1: Apply discount to subtotal
      const subtotalAfterDiscount = subtotal - discount;

      // Step 2: Calculate interest on subtotal (after discount, before tax)
      const interestRate = parseFloat(term.interestRate);
      const interestAmount =
        term.type === "cash"
          ? 0
          : (subtotalAfterDiscount * interestRate) / 100;

      // Step 3: Calculate amount before tax
      const amountBeforeTax = subtotalAfterDiscount + interestAmount;

      // Step 4: Calculate tax on (subtotal + interest)
      const taxAmount = (amountBeforeTax * taxRate) / 100;

      // Step 5: Calculate total
      const total = amountBeforeTax + taxAmount;

      // Calculate due date
      const dueDate = new Date();
      if (term.daysUntilDue) {
        dueDate.setDate(dueDate.getDate() + term.daysUntilDue);
      } else if (term.numberOfTerms && term.termLengthDays) {
        dueDate.setDate(
          dueDate.getDate() + term.numberOfTerms * term.termLengthDays
        );
      }

      // Create breakdown for audit trail
      const breakdown = {
        step1_subtotal: subtotal.toFixed(2),
        step2_discount: discount.toFixed(2),
        step3_subtotal_after_discount: subtotalAfterDiscount.toFixed(2),
        step4_interest_rate: `${interestRate}%`,
        step5_interest_amount: interestAmount.toFixed(2),
        step6_amount_before_tax: amountBeforeTax.toFixed(2),
        step7_tax_rate: `${taxRate}%`,
        step8_tax_amount: taxAmount.toFixed(2),
        step9_total: total.toFixed(2),
        calculation_formula:
          term.type === "cash"
            ? "(Subtotal - Discount) + Tax"
            : "(Subtotal - Discount) + Interest + Tax",
      };

      return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        subtotalAfterDiscount: parseFloat(subtotalAfterDiscount.toFixed(2)),
        interestRate: parseFloat(interestRate.toFixed(2)),
        interestAmount: parseFloat(interestAmount.toFixed(2)),
        amountBeforeTax: parseFloat(amountBeforeTax.toFixed(2)),
        taxRate: parseFloat(taxRate.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        dueDate: dueDate.toISOString(),
        paymentTermName: term.name,
        paymentTermType: term.type,
        termsAndConditions: term.termsAndConditions,
        breakdown: JSON.stringify(breakdown, null, 2),
      };
    }),

  // Get applied payment terms for a document
  getAppliedTerms: protectedProcedure
    .meta({
      openapi: { method: "GET", path: "/payment-terms/applied/{documentId}" },
    })
    .input(
      z.object({
        documentId: z.string(),
        documentType: z.enum(["Invoice", "Quote"]),
      })
    )
    .query(async ({ input }) => {
      const applied = await db.query.appliedPaymentTerms.findFirst({
        where: and(
          eq(appliedPaymentTerms.documentId, input.documentId),
          eq(appliedPaymentTerms.documentType, input.documentType)
        ),
        with: {
          paymentTerm: true,
        },
      });

      return applied;
    }),
});
