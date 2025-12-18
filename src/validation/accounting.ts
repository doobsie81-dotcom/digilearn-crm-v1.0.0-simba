import { z } from "zod";
import {
  invoiceStatusEnum,
  paymentStatusEnum,
  quoteStatusEnum,
} from "~/db/schema/accounting-schema";

export const quoteItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.string(),
  discount: z.string(),
  unitPrice: z.string(),
  tax: z.string().optional(),
  taxRate: z.string().optional(),
});

export const createQuoteSchema = z.object({
  quoteNumber: z.string().min(1),
  personId: z.string().optional(),
  dealId: z.string().optional(),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.email().optional(),
  clientAddress: z.string().optional(),
  validUntil: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1),
  paymentTermId: z.string().optional(),
  interest: z.string().optional(),
  tax: z.string().optional(),
  total: z.string().optional(),
});

export const updateQuoteSchema = createQuoteSchema.partial().extend({
  id: z.string(),
  status: z.enum(quoteStatusEnum).optional(),
  poReceived: z.boolean().optional(),
});

export const invoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1),
  quantity: z.string(),
  unitPrice: z.string(),
  discount: z.string(),
  tax: z.string().optional(),
  taxRate: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  quoteId: z.string().optional(),
  personId: z.string().optional(),
  dealId: z.string().optional(),
  clientId: z.string().min(1),
  clientName: z.string().min(1),
  clientEmail: z.email().optional(),
  clientAddress: z.string().optional(),
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1),
  paymentTermId: z.string().optional(),
  interest: z.string().optional(),
  tax: z.string().optional(),
  total: z.string(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  id: z.string(),
  status: z.enum(invoiceStatusEnum).optional(),
  paymentStatus: z.enum(paymentStatusEnum).optional(),
  amountPaid: z.string().or(z.number()).transform(String).optional(),
  paidDate: z.date().optional(),
});
