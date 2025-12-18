// src/server/api/services/invoice-service.ts
import { eq, and } from "drizzle-orm";
import { documentItems, invoices, quotes } from "~/db/schema/accounting-schema";
import type { DbExecutor, NewInvoice } from "~/db/types";
import { products } from "~/db/schema";
import { calculateItemTotal, calculateTotals } from "./accounting";
import {
  createInvoiceSchema,
  invoiceItemSchema,
  updateInvoiceSchema,
} from "~/validation/accounting";
import z from "zod";
import { generateDocumentNumber } from "~/lib/generators";

export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;

export class InvoiceService {
  /**
   * Creates an invoice with items
   * @param db - Database executor (can be main db or transaction)
   * @param input - Invoice creation data
   */
  static async createInvoice(db: DbExecutor, input: CreateInvoiceInput) {
    const { items, ...invoiceData } = input;
    const totals = calculateTotals(items);

    // Create invoice
    const [invoice] = await db
      .insert(invoices)
      .values({
        ...invoiceData,
        ...totals,
        status: "Draft",
        paymentStatus: "Unpaid",
        amountPaid: "0",
      } as NewInvoice)
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

        return {
          documentType: "Invoice" as const,
          documentId: invoice.id,
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

    await db.insert(documentItems).values(invoiceItems);

    return {
      id: invoice.id,
      invoiceNumber: invoiceData.invoiceNumber,
    };
  }

  /**
   * Updates an invoice with optional items and payment info
   * @param db - Database executor
   * @param input - Update data
   */
  static async updateInvoice(db: DbExecutor, input: UpdateInvoiceInput) {
    const { id, items, ...invoiceData } = input;

    const existing = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
    });

    if (!existing) {
      throw new Error("Invoice not found");
    }

    // Handle payment updates
    if (invoiceData.amountPaid !== undefined) {
      const total = parseFloat(existing.total);
      const paid = parseFloat(invoiceData.amountPaid);

      if (paid >= total) {
        invoiceData.paymentStatus = "Paid";
        invoiceData.paidDate = new Date();
      } else if (paid > 0) {
        invoiceData.paymentStatus = "Partial";
      } else {
        invoiceData.paymentStatus = "Unpaid";
      }
    } else if (invoiceData.paymentStatus) {
      if (invoiceData.paymentStatus === "Paid" && !existing.paidDate) {
        invoiceData.paidDate = new Date();
      }
    }

    // Update totals if items provided
    if (items) {
      const totals = calculateTotals(items);
      Object.assign(invoiceData, totals);

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

          return {
            documentType: "Invoice" as const,
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

      await db.insert(documentItems).values(invoiceItems);
    }

    await db.update(invoices).set(invoiceData).where(eq(invoices.id, id));

    return { success: true };
  }

  /**
   * Deletes an invoice and its items
   * @param db - Database executor
   * @param invoiceId - Invoice ID to delete
   */
  static async deleteInvoice(db: DbExecutor, invoiceId: string) {
    await db
      .delete(documentItems)
      .where(
        and(
          eq(documentItems.documentType, "Invoice"),
          eq(documentItems.documentId, invoiceId)
        )
      );

    await db.delete(invoices).where(eq(invoices.id, invoiceId));

    return { success: true };
  }

  /**
   * Creates an invoice from a quote
   * @param db - Database executor
   * @param quoteId - Quote ID to convert
   * @param additionalData - Additional invoice data (dueDate, invoiceNumber, etc.)
   */
  static async createFromQuote(
    db: DbExecutor,
    quoteId: string,
    additionalData?: Partial<CreateInvoiceInput>
  ) {
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

    const invoiceNumber = generateDocumentNumber("INV");

    // Create invoice from quote data
    return this.createInvoice(db, {
      ...additionalData,
      invoiceNumber,
      clientId: quote.clientId,
      clientName: quote.clientName,
      quoteId: quote.id,
      dealId: quote.dealId ?? "",
      items: quote.items.map((item) => ({
        productId: item.productId ?? undefined,
        description: item.description ?? undefined,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        tax: item.tax,
      })),
      total: quote.total,
      notes: quote.notes ?? undefined,
    });
  }
}
