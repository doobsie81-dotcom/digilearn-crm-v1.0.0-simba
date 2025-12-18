import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, between, gte, lte, desc, sql } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import {
  documentItems,
  invoices,
  invoiceStatusEnum,
  paymentStatusEnum,
  quotes,
  quoteStatusEnum,
} from "~/db/schema/accounting-schema";
import { NewInvoice, NewQuote } from "~/db/types";
import { products, deals } from "~/db/schema";
import {
  createQuoteSchema,
  createInvoiceSchema,
  updateQuoteSchema,
  updateInvoiceSchema,
} from "~/validation/accounting";
import {
  calculateItemTotal,
  calculateItemTotalDiscountAndTax,
  calculateTotals,
} from "../services/accounting";
import { InvoiceService } from "../services/invoices";
import { getUserPermissions, can } from "~/lib/get-user-permissions";
import { paymentTerms, appliedPaymentTerms } from "~/db/schema/payment-terms-schema";
import { calculatePaymentTerms } from "~/lib/payment-terms-calculator";

// Quotes Router
export const quotesRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/quotes" } })
    .input(createQuoteSchema)
    .mutation(async ({ input }) => {
      const { items, paymentTermId, interest, tax, total, ...quoteData } = input;
      const totals = calculateTotals(items);

      // Apply payment terms if provided
      let finalInterest = "0.00";
      let finalTax = totals.tax;
      let finalTotal = totals.total;
      let paymentTermSnapshot = null;

      if (paymentTermId && interest && tax && total) {
        // Use provided payment terms calculation
        finalInterest = interest;
        finalTax = tax;
        finalTotal = total;

        // Fetch payment term for audit trail
        const paymentTerm = await db.query.paymentTerms.findFirst({
          where: eq(paymentTerms.id, paymentTermId),
        });

        if (paymentTerm) {
          paymentTermSnapshot = paymentTerm;
        }
      } else if (paymentTermId) {
        // Calculate payment terms if paymentTermId is provided but values aren't
        const paymentTerm = await db.query.paymentTerms.findFirst({
          where: eq(paymentTerms.id, paymentTermId),
        });

        if (paymentTerm) {
          const calculation = calculatePaymentTerms({
            subtotal: parseFloat(totals.subtotal),
            discount: parseFloat(totals.discount),
            taxRate: 0, // Tax rate will be included in the calculation
            interestRate: parseFloat(paymentTerm.interestRate),
            numberOfTerms: paymentTerm.numberOfTerms || 9,
          });

          finalInterest = calculation.interestAmount.toFixed(2);
          finalTax = calculation.taxAmount.toFixed(2);
          finalTotal = calculation.total.toFixed(2);
          paymentTermSnapshot = paymentTerm;
        }
      }

      // Create quote
      const [quote] = await db
        .insert(quotes)
        .values({
          ...quoteData,
          ...totals,
          interest: finalInterest,
          tax: finalTax,
          total: finalTotal,
          paymentTermId: paymentTermId || null,
        })
        .$returningId();

      // Create items with product tracking
      const quoteItems = await Promise.all(
        items.map(async (item) => {
          // If productId provided, fetch product details to populate description if needed
          let description = item.description;
          if (item.productId && !item.description) {
            const product = await db.query.products.findFirst({
              where: eq(products.id, item.productId),
            });
            if (product) {
              description = product.name;
            }
          }

          const { itemDiscount, itemTax } = calculateItemTotalDiscountAndTax(
            item.quantity,
            item.unitPrice,
            item.discount,
            item.taxRate
          );

          return {
            documentType: "Quote" as const,
            documentId: quote.id,
            productId: item.productId || null,
            description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: itemDiscount.toFixed(2) || item.discount || "0",
            tax: itemTax.toFixed(2) || item.tax || "0",
            taxRate: item.taxRate || "0",
            total: calculateItemTotal(
              item.quantity,
              item.unitPrice,
              item.discount,
              item.tax
            ),
          };
        })
      );

      await db.insert(documentItems).values(quoteItems);

      // Create applied payment terms audit record
      if (paymentTermSnapshot) {
        const calculationBreakdown = {
          subtotal: totals.subtotal,
          discount: totals.discount,
          subtotalAfterDiscount: (parseFloat(totals.subtotal) - parseFloat(totals.discount)).toFixed(2),
          interestRate: paymentTermSnapshot.interestRate,
          interestAmount: finalInterest,
          taxAmount: finalTax,
          total: finalTotal,
          numberOfTerms: paymentTermSnapshot.numberOfTerms,
        };

        await db.insert(appliedPaymentTerms).values({
          documentId: quote.id,
          documentType: "Quote",
          paymentTermId: paymentTermSnapshot.id,
          termName: paymentTermSnapshot.name || paymentTermSnapshot.type,
          termType: paymentTermSnapshot.type,
          interestRate: paymentTermSnapshot.interestRate,
          interestAmount: finalInterest,
          numberOfTerms: paymentTermSnapshot.numberOfTerms,
          termLengthDays: paymentTermSnapshot.termLengthDays,
          daysUntilDue: paymentTermSnapshot.daysUntilDue,
          termsAndConditions: paymentTermSnapshot.termsAndConditions,
          calculationBreakdown: JSON.stringify(calculationBreakdown),
        });
      }

      // Update deal value if quote is linked to a deal
      if (quoteData.dealId) {
        await db
          .update(deals)
          .set({
            value: totals.subtotal,
          })
          .where(eq(deals.id, quoteData.dealId));
      }

      return { id: quote.id };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/quotes/{id}" } })
    .input(updateQuoteSchema)
    .mutation(async ({ input }) => {
      const { id, items, paymentTermId, interest, tax, total, ...quoteData } = input;

      // Check if quote exists
      const existing = await db.query.quotes.findFirst({
        where: eq(quotes.id, id),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      // Update totals if items provided
      if (items) {
        const totals = calculateTotals(items);

        // Apply payment terms if provided
        let finalInterest = "0.00";
        let finalTax = totals.tax;
        let finalTotal = totals.total;

        if (paymentTermId && interest && tax && total) {
          // Use provided payment terms calculation
          finalInterest = interest;
          finalTax = tax;
          finalTotal = total;
        } else if (paymentTermId) {
          // Calculate payment terms if paymentTermId is provided but values aren't
          const paymentTerm = await db.query.paymentTerms.findFirst({
            where: eq(paymentTerms.id, paymentTermId),
          });

          if (paymentTerm) {
            const calculation = calculatePaymentTerms({
              subtotal: parseFloat(totals.subtotal),
              discount: parseFloat(totals.discount),
              taxRate: 0,
              interestRate: parseFloat(paymentTerm.interestRate),
              numberOfTerms: paymentTerm.numberOfTerms || 9,
            });

            finalInterest = calculation.interestAmount.toFixed(2);
            finalTax = calculation.taxAmount.toFixed(2);
            finalTotal = calculation.total.toFixed(2);
          }
        }

        Object.assign(quoteData, {
          ...totals,
          interest: finalInterest,
          tax: finalTax,
          total: finalTotal,
          paymentTermId: paymentTermId || null,
        });

        // Delete old items and insert new ones
        await db
          .delete(documentItems)
          .where(
            and(
              eq(documentItems.documentType, "Quote"),
              eq(documentItems.documentId, id)
            )
          );

        const quoteItems = await Promise.all(
          items.map(async (item) => {
            let description = item.description;
            if (item.productId && !item.description) {
              const product = await db.query.products.findFirst({
                where: eq(products.id, item.productId),
              });
              if (product) {
                description = product.name;
              }
            }

            const { itemDiscount, itemTax } = calculateItemTotalDiscountAndTax(
              item.quantity,
              item.unitPrice,
              item.discount,
              item.taxRate
            );

            return {
              documentType: "Quote" as const,
              documentId: id,
              productId: item.productId || null,
              description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: itemDiscount.toFixed(2) || item.discount || "0",
              tax: itemTax.toFixed(2) || item.tax || "0",
              taxRate: item.taxRate || "0",
              total: calculateItemTotal(
                item.quantity,
                item.unitPrice,
                item.discount,
                item.tax
              ),
            };
          })
        );

        await db.insert(documentItems).values(quoteItems);

        // Update deal value if quote is linked to a deal
        if (existing.dealId) {
          await db
            .update(deals)
            .set({
              value: totals.subtotal,
            })
            .where(eq(deals.id, existing.dealId));
        }
      }

      // Update quote
      await db.update(quotes).set(quoteData).where(eq(quotes.id, id));

      return { success: true };
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/quotes/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const quote = await db.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
        with: {
          items: {
            with: {
              product: true,
            },
          },
          client: true,
        },
      });

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      return quote;
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/quotes/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      // Delete items first
      await db
        .delete(documentItems)
        .where(
          and(
            eq(documentItems.documentType, "Quote"),
            eq(documentItems.documentId, input.id)
          )
        );

      // Delete quote
      await db.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/quotes/{id}/status" } })
    .input(updateQuoteSchema)
    .mutation(async ({ input }) => {
      const quoteToUpdate = await db.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
      });

      if (!quoteToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quote was not found",
        });
      }

      // only update if not already accepted or rejected.
      if (
        quoteToUpdate.status !== "Accepted" &&
        quoteToUpdate.status !== "Rejected"
      ) {
        // if it is expired instead, let us advise the user to create a new quote... before accepting or sending.
        // or rather for an expired state.
        await db
          .update(quotes)
          .set({ status: input.status })
          .where(eq(quotes.id, input.id));

        // if status is send - we should send an email.
        // if there's a deal associated, record the activity.
        // create an invoice if accepted...
        if (input.status === "Accepted") {
          await InvoiceService.createFromQuote(db, quoteToUpdate.id);
        }
      }

      return { success: true };
    }),
  listWithFilters: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/quotes" } })
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(quoteStatusEnum).optional(),
        clientId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "Quote")[0].conditions;

      const allowed = can(abilities, "read", "Quote");

      const owner = ruleConditions?.createdBy;

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view quotes",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own quotes",
        });
      }

      if (owner) {
        conditions.push(eq(quotes.ownerId, owner as string));
      }

      if (input.startDate && input.endDate) {
        conditions.push(
          between(quotes.createdAt, input.startDate, input.endDate)
        );
      } else if (input.startDate) {
        conditions.push(gte(quotes.createdAt, input.startDate));
      } else if (input.endDate) {
        conditions.push(lte(quotes.createdAt, input.endDate));
      }

      if (input.status) {
        conditions.push(eq(quotes.status, input.status));
      }

      if (input.clientId) {
        conditions.push(eq(quotes.clientId, input.clientId));
      }

      const items = await db.query.quotes.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(quotes.createdAt)],
        with: {
          client: {
            columns: {
              id: true,
              name: true,
            },
          },
          items: true,
        },
      });

      // Get total count
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(quotes)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        quotes: items,
        total: totalCount[0]?.count ?? 0,
      };
    }),
  getStatistics: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/quotes/statistics" } })
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "Quote")[0].conditions;

      const allowed = can(abilities, "read", "Quote");

      const owner = ruleConditions?.createdBy;

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view quotes",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own quotes",
        });
      }

      if (owner) {
        conditions.push(eq(quotes.ownerId, owner as string));
      }

      if (input.startDate && input.endDate) {
        conditions.push(
          between(quotes.createdAt, input.startDate, input.endDate)
        );
      } else if (input.startDate) {
        conditions.push(gte(quotes.createdAt, input.startDate));
      } else if (input.endDate) {
        conditions.push(lte(quotes.createdAt, input.endDate));
      }

      const allQuotes = await db.query.quotes.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        columns: {
          status: true,
          total: true,
        },
      });

      const totalQuotes = allQuotes.length;
      const totalValue = allQuotes.reduce(
        (sum, q) => sum + parseFloat(q.total),
        0
      );
      const accepted = allQuotes.filter((q) => q.status === "Accepted").length;
      const rejected = allQuotes.filter((q) => q.status === "Rejected").length;
      const draft = allQuotes.filter((q) => q.status === "Draft").length;
      const sent = allQuotes.filter((q) => q.status === "Sent").length;
      const expired = allQuotes.filter((q) => q.status === "Expired").length;

      const acceptedValue = allQuotes
        .filter((q) => q.status === "Accepted")
        .reduce((sum, q) => sum + parseFloat(q.total), 0);

      return {
        totalQuotes,
        totalValue,
        accepted,
        rejected,
        draft,
        sent,
        expired,
        acceptedValue,
        conversionRate: totalQuotes > 0 ? (accepted / totalQuotes) * 100 : 0,
      };
    }),
  sendEmail: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/quotes/{id}/send-email" } })
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      //const { id } = input;

      // Implement email sending logic here

      return { success: true };
    }),
  duplicate: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/quotes/{id}/duplicate" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.query.quotes.findFirst({
        where: eq(quotes.id, input.id),
        with: { items: true },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      const { items, ...quoteData } = existing;
      delete (quoteData as NewQuote).id; // Remove id to avoid conflicts
      quoteData.status = "Draft"; // Reset status for the new quote

      // Create new quote
      const [newQuote] = await db
        .insert(quotes)
        .values({ ...quoteData })
        .$returningId();

      // Duplicate items
      const newItems = items.map((item) => ({
        documentType: "Quote" as const,
        documentId: newQuote.id,
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
        total: item.total,
      }));

      await db.insert(documentItems).values(newItems);

      return { id: newQuote.id };
    }),
});

// Invoices Router
export const invoicesRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/invoices" } })
    .input(createInvoiceSchema)
    .mutation(async ({ input }) => {
      const { items, paymentTermId, interest, tax, total, ...invoiceData } = input;
      const totals = calculateTotals(items);

      // Apply payment terms if provided
      let finalInterest = "0.00";
      let finalTax = totals.tax;
      let finalTotal = totals.total;
      let paymentTermSnapshot = null;

      if (paymentTermId && interest && tax && total) {
        // Use provided payment terms calculation
        finalInterest = interest;
        finalTax = tax;
        finalTotal = total;

        // Fetch payment term for audit trail
        const paymentTerm = await db.query.paymentTerms.findFirst({
          where: eq(paymentTerms.id, paymentTermId),
        });

        if (paymentTerm) {
          paymentTermSnapshot = paymentTerm;
        }
      } else if (paymentTermId) {
        // Calculate payment terms if paymentTermId is provided but values aren't
        const paymentTerm = await db.query.paymentTerms.findFirst({
          where: eq(paymentTerms.id, paymentTermId),
        });

        if (paymentTerm) {
          const calculation = calculatePaymentTerms({
            subtotal: parseFloat(totals.subtotal),
            discount: parseFloat(totals.discount),
            taxRate: 0, // Tax rate will be included in the calculation
            interestRate: parseFloat(paymentTerm.interestRate),
            numberOfTerms: paymentTerm.numberOfTerms || 9,
          });

          finalInterest = calculation.interestAmount.toFixed(2);
          finalTax = calculation.taxAmount.toFixed(2);
          finalTotal = calculation.total.toFixed(2);
          paymentTermSnapshot = paymentTerm;
        }
      }

      // Create invoice
      const [invoice] = await db
        .insert(invoices)
        .values({
          ...invoiceData,
          ...totals,
          interest: finalInterest,
          tax: finalTax,
          total: finalTotal,
          paymentTermId: paymentTermId || null,
        })
        .$returningId();

      // Create items with product tracking
      const invoiceItems = await Promise.all(
        items.map(async (item) => {
          let description = item.description;
          if (item.productId && !item.description) {
            const product = await db.query.products.findFirst({
              where: eq(products.id, item.productId),
            });
            if (product) {
              description = product.name;
            }
          }

          const { itemDiscount, itemTax } = calculateItemTotalDiscountAndTax(
            item.quantity,
            item.unitPrice,
            item.discount,
            item.taxRate
          );

          return {
            documentType: "Invoice" as const,
            documentId: invoice.id,
            productId: item.productId || null,
            description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: itemDiscount.toFixed(2) || item.discount || "0",
            tax: itemTax.toFixed(2) || item.tax || "0",
            taxRate: item.taxRate || "0",
            total: calculateItemTotal(
              item.quantity,
              item.unitPrice,
              item.discount,
              item.taxRate
            ),
          };
        })
      );

      await db.insert(documentItems).values(invoiceItems);

      // Create applied payment terms audit record
      if (paymentTermSnapshot) {
        const calculationBreakdown = {
          subtotal: totals.subtotal,
          discount: totals.discount,
          subtotalAfterDiscount: (parseFloat(totals.subtotal) - parseFloat(totals.discount)).toFixed(2),
          interestRate: paymentTermSnapshot.interestRate,
          interestAmount: finalInterest,
          taxAmount: finalTax,
          total: finalTotal,
          numberOfTerms: paymentTermSnapshot.numberOfTerms,
        };

        await db.insert(appliedPaymentTerms).values({
          documentId: invoice.id,
          documentType: "Invoice",
          paymentTermId: paymentTermSnapshot.id,
          termName: paymentTermSnapshot.name || paymentTermSnapshot.type,
          termType: paymentTermSnapshot.type,
          interestRate: paymentTermSnapshot.interestRate,
          interestAmount: finalInterest,
          numberOfTerms: paymentTermSnapshot.numberOfTerms,
          termLengthDays: paymentTermSnapshot.termLengthDays,
          daysUntilDue: paymentTermSnapshot.daysUntilDue,
          dueDate: invoiceData.dueDate || null,
          termsAndConditions: paymentTermSnapshot.termsAndConditions,
          calculationBreakdown: JSON.stringify(calculationBreakdown),
        });
      }

      // Update deal value if invoice is linked to a deal
      if (invoiceData.dealId) {
        await db
          .update(deals)
          .set({
            value: totals.subtotal,
          })
          .where(eq(deals.id, invoiceData.dealId));
      }

      return { id: invoice.id };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/invoices/{id}" } })
    .input(updateInvoiceSchema)
    .mutation(async ({ input }) => {
      const { id, items, paymentTermId, interest, tax, total, ...invoiceData } = input;

      const existing = await db.query.invoices.findFirst({
        where: eq(invoices.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Handle payment updates
      if (invoiceData.amountPaid !== undefined) {
        const totalAmount = parseFloat(existing.total);
        const paid = parseFloat(invoiceData.amountPaid);

        if (paid >= totalAmount) {
          invoiceData.paymentStatus = "Paid";
          invoiceData.paidDate = new Date();
        } else if (paid > 0) {
          invoiceData.paymentStatus = "Partial";
        } else {
          invoiceData.paymentStatus = "Unpaid";
        }
      } else if (invoiceData.paymentStatus) {
        if (
          (invoiceData.paymentStatus === "Paid" ||
            invoiceData.status === "Paid") &&
          !existing.paidDate
        ) {
          invoiceData.paidDate = new Date();
        }
      }

      // Update totals if items provided
      if (items) {
        const totals = calculateTotals(items);

        // Apply payment terms if provided
        let finalInterest = "0.00";
        let finalTax = totals.tax;
        let finalTotal = totals.total;

        if (paymentTermId && interest && tax && total) {
          // Use provided payment terms calculation
          finalInterest = interest;
          finalTax = tax;
          finalTotal = total;
        } else if (paymentTermId) {
          // Calculate payment terms if paymentTermId is provided but values aren't
          const paymentTerm = await db.query.paymentTerms.findFirst({
            where: eq(paymentTerms.id, paymentTermId),
          });

          if (paymentTerm) {
            const calculation = calculatePaymentTerms({
              subtotal: parseFloat(totals.subtotal),
              discount: parseFloat(totals.discount),
              taxRate: 0,
              interestRate: parseFloat(paymentTerm.interestRate),
              numberOfTerms: paymentTerm.numberOfTerms || 9,
            });

            finalInterest = calculation.interestAmount.toFixed(2);
            finalTax = calculation.taxAmount.toFixed(2);
            finalTotal = calculation.total.toFixed(2);
          }
        }

        Object.assign(invoiceData, {
          ...totals,
          interest: finalInterest,
          tax: finalTax,
          total: finalTotal,
          paymentTermId: paymentTermId || null,
        });

        await db
          .delete(documentItems)
          .where(
            and(
              eq(documentItems.documentType, "Invoice"),
              eq(documentItems.documentId, id)
            )
          );

        const invoiceItems = await Promise.all(
          items.map(async (item) => {
            let description = item.description;
            if (item.productId && !item.description) {
              const product = await db.query.products.findFirst({
                where: eq(products.id, item.productId),
              });
              if (product) {
                description = product.name;
              }
            }
            const { itemDiscount, itemTax } = calculateItemTotalDiscountAndTax(
              item.quantity,
              item.unitPrice,
              item.discount,
              item.taxRate
            );
            return {
              documentType: "Invoice" as const,
              documentId: id,
              productId: item.productId || null,
              description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: itemDiscount.toFixed(2) || item.discount || "0",
              tax: itemTax.toFixed(2) || item.tax || "0",
              taxRate: item.taxRate || "0",
              total: calculateItemTotal(
                item.quantity,
                item.unitPrice,
                item.discount,
                item.tax
              ),
            };
          })
        );

        await db.insert(documentItems).values(invoiceItems);

        // Update deal value if invoice is linked to a deal
        if (existing.dealId) {
          await db
            .update(deals)
            .set({
              value: totals.subtotal,
            })
            .where(eq(deals.id, existing.dealId));
        }
      }

      await db.update(invoices).set(invoiceData).where(eq(invoices.id, id));

      return { success: true };
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/invoices/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, input.id),
        with: {
          items: {
            with: {
              product: true,
            },
          },
          client: true,
          quote: true,
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      return invoice;
    }),

  delete: protectedProcedure
    .meta({ openapi: { method: "DELETE", path: "/invoices/{id}" } })
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db
        .delete(documentItems)
        .where(
          and(
            eq(documentItems.documentType, "Invoice"),
            eq(documentItems.documentId, input.id)
          )
        );

      await db.delete(invoices).where(eq(invoices.id, input.id));

      return { success: true };
    }),

  updatePaymentStatus: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/invoices/{id}/payment-status" } })
    .input(
      z.object({
        id: z.string(),
        paymentStatus: z.enum(["Unpaid", "Partial", "Paid"]),
        amountPaid: z.string().or(z.number()).transform(String),
      })
    )
    .mutation(async ({ input }) => {
      const updateData: Partial<NewInvoice> = {
        paymentStatus: input.paymentStatus,
        amountPaid: input.amountPaid,
      };

      if (input.paymentStatus === "Paid") {
        updateData.paidDate = new Date();
      }

      await db
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, input.id));

      return { success: true };
    }),
  listWithFilters: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/invoices" } })
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(invoiceStatusEnum).optional(),
        paymentStatus: z.enum(paymentStatusEnum).optional(),
        clientId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "Quote")[0].conditions;

      const allowed = can(abilities, "read", "Quote");

      const owner = ruleConditions?.createdBy;

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view quotes",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own quotes",
        });
      }

      if (owner) {
        conditions.push(eq(quotes.ownerId, owner as string));
      }

      if (input.startDate && input.endDate) {
        conditions.push(
          between(invoices.createdAt, input.startDate, input.endDate)
        );
      } else if (input.startDate) {
        conditions.push(gte(invoices.createdAt, input.startDate));
      } else if (input.endDate) {
        conditions.push(lte(invoices.createdAt, input.endDate));
      }

      if (input.status) {
        conditions.push(eq(invoices.status, input.status));
      }

      if (input.paymentStatus) {
        conditions.push(eq(invoices.paymentStatus, input.paymentStatus));
      }

      if (input.clientId) {
        conditions.push(eq(invoices.clientId, input.clientId));
      }

      const items = await db.query.invoices.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input.limit,
        offset: input.offset,
        orderBy: [desc(invoices.createdAt)],
        with: {
          client: {
            columns: {
              id: true,
              name: true,
            },
          },
          items: true,
        },
      });

      // Get total count
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(invoices)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        invoices: items,
        total: totalCount[0]?.count ?? 0,
      };
    }),
  getStatistics: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/invoices/statistics" } })
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      const abilities = await getUserPermissions(ctx.user, ctx.userPermissions);

      const ruleConditions = abilities.rulesFor("read", "Invoice")[0]
        .conditions;

      const allowed = can(abilities, "read", "Invoice");

      const owner = ruleConditions?.createdBy;

      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to view quotes",
        });
      }

      if (allowed && owner && owner !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only view your own quotes",
        });
      }

      if (owner) {
        conditions.push(eq(quotes.ownerId, owner as string));
      }

      if (input.startDate && input.endDate) {
        conditions.push(
          between(invoices.createdAt, input.startDate, input.endDate)
        );
      } else if (input.startDate) {
        conditions.push(gte(invoices.createdAt, input.startDate));
      } else if (input.endDate) {
        conditions.push(lte(invoices.createdAt, input.endDate));
      }

      const allInvoices = await db.query.invoices.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        columns: {
          status: true,
          total: true,
        },
      });

      const totalInvoices = allInvoices.length;
      const totalValue = allInvoices.reduce(
        (sum, q) => sum + parseFloat(q.total),
        0
      );
      const paid = allInvoices.filter((i) => i.status === "Paid").length;
      const cancelled = allInvoices.filter(
        (i) => i.status === "Cancelled"
      ).length;
      const draft = allInvoices.filter((i) => i.status === "Draft").length;
      const sent = allInvoices.filter((i) => i.status === "Sent").length;
      const overdue = allInvoices.filter((i) => i.status === "Overdue").length;

      const paidValue = allInvoices
        .filter((q) => q.status === "Paid")
        .reduce((sum, q) => sum + parseFloat(q.total), 0);

      return {
        totalInvoices,
        totalValue,
        paid,
        cancelled,
        draft,
        sent,
        overdue,
        paidValue,
        conversionRate: totalInvoices > 0 ? (paid / totalInvoices) * 100 : 0,
      };
    }),
  updateStatus: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/invoices/{id}/status" } })
    .input(
      z.object({
        id: z.string(),
        status: z.enum(invoiceStatusEnum),
      })
    )
    .mutation(async ({ input }) => {
      const invoiceToUpdate = await db.query.invoices.findFirst({
        where: eq(invoices.id, input.id),
      });

      if (!invoiceToUpdate) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Quote was not found",
        });
      }

      // only update if not already accepted or rejected.
      if (
        invoiceToUpdate.status !== "Paid" &&
        invoiceToUpdate.status !== "Cancelled"
      ) {
        // if it is expired instead, let us advise the user to create a new invoice... before accepting or sending.
        // or rather for an expired state.
        await db
          .update(invoices)
          .set({
            status: input.status,
            ...(input.status === "Paid" ? { paidDate: new Date() } : {}),
          })
          .where(eq(invoices.id, input.id));

        // if status is send - we should send an email.
        // if there's a deal associated, record the activity.
      }

      // create an invoice if accepted...

      return { success: true };
    }),
  sendEmail: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/invoices/{id}/send-email" } })
    .input(z.object({ id: z.string() }))
    .mutation(async () => {
      //const { id } = input;

      // Implement email sending logic here

      return { success: true };
    }),
});
