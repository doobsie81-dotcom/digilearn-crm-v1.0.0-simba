// src/server/api/services/quote-service.ts
import { eq, and } from "drizzle-orm";
import {
  quoteItemSchema,
  createQuoteSchema,
  updateQuoteSchema,
} from "~/validation/accounting";
import { documentItems, quotes } from "~/db/schema";
import type { NewQuote, DbExecutor } from "~/db/types";
import { products } from "~/db/schema";
import { calculateItemTotal, calculateTotals } from "./accounting";
import z from "zod";

export type QuoteItem = z.infer<typeof quoteItemSchema>;

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export type UpdateQuoteInput = z.infer<typeof updateQuoteSchema>;

export class QuoteService {
  /**
   * Creates a quote with items
   * @param db - Database executor (can be main db or transaction)
   * @param input - Quote creation data
   */
  static async createQuote(db: DbExecutor, input: CreateQuoteInput) {
    const { items, ...quoteData } = input;
    const totals = calculateTotals(items);

    // Create quote
    const [quote] = await db
      .insert(quotes)
      .values({
        ...quoteData,
        ...totals,
        status: "Draft",
      } as NewQuote)
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

        return {
          documentType: "Quote" as const,
          documentId: quote.id,
          productId: item.productId || null,
          description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || "0",
          tax: item.tax || "0",
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

    return {
      id: quote.id,
      quoteNumber: quoteData.quoteNumber,
      total: totals.total
    };
  }

  /**
   * Updates a quote with optional items
   * @param db - Database executor
   * @param input - Update data
   */
  static async updateQuote(db: DbExecutor, input: UpdateQuoteInput) {
    const { id, items, ...quoteData } = input;

    // Check if quote exists
    const existing = await db.query.quotes.findFirst({
      where: eq(quotes.id, id),
    });

    if (!existing) {
      throw new Error("Quote not found");
    }

    // Update totals if items provided
    if (items) {
      const totals = calculateTotals(items);
      Object.assign(quoteData, totals);

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

          return {
            documentType: "Quote" as const,
            documentId: id,
            productId: item.productId || null,
            description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || "0",
            tax: item.tax || "0",
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
    }

    // Update quote
    await db.update(quotes).set(quoteData).where(eq(quotes.id, id));

    return { success: true };
  }

  /**
   * Deletes a quote and its items
   * @param db - Database executor
   * @param quoteId - Quote ID to delete
   */
  static async deleteQuote(db: DbExecutor, quoteId: string) {
    // Delete items first
    await db
      .delete(documentItems)
      .where(
        and(
          eq(documentItems.documentType, "Quote"),
          eq(documentItems.documentId, quoteId)
        )
      );

    // Delete quote
    await db.delete(quotes).where(eq(quotes.id, quoteId));

    return { success: true };
  }

  /**
   * Duplicates a quote with all its items
   * @param db - Database executor
   * @param quoteId - Quote ID to duplicate
   */
  static async duplicateQuote(db: DbExecutor, quoteId: string) {
    const existing = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
      with: { items: true },
    });

    if (!existing) {
      throw new Error("Quote not found");
    }

    const { items, ...quoteData } = existing;
    delete (quoteData as NewQuote).id; // Remove id to avoid conflicts
    quoteData.status = "Draft"; // Reset status for the new quote

    // Create new quote
    const [newQuote] = await db
      .insert(quotes)
      .values({ ...quoteData } as NewQuote)
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
  }

  /**
   * Creates an invoice from an accepted quote
   * @param db - Database executor
   * @param quoteId - Quote ID to convert
   */
  static async convertToInvoice(db: DbExecutor, quoteId: string) {
    const quote = await db.query.quotes.findFirst({
      where: eq(quotes.id, quoteId),
      with: { items: true },
    });

    if (!quote) {
      throw new Error("Quote not found");
    }

    if (quote.status !== "Accepted") {
      throw new Error("Only accepted quotes can be converted to invoices");
    }

    // This will be implemented in the invoice service
    // For now, return the quote data that can be used to create an invoice
    return {
      clientId: quote.clientId,
      quoteId: quote.id,
      items: quote.items.map((item) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
      })),
      subtotal: quote.subtotal,
      tax: quote.tax,
      discount: quote.discount,
      total: quote.total,
      notes: quote.notes,
    };
  }
}
