import {
  mysqlTable,
  varchar,
  decimal,
  timestamp,
  mysqlEnum,
  text,
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { companies } from "./leads-schema";
import { products } from "./products-schema";
import { v4 as uuidv4 } from "uuid";
import { TAX_CONFIG } from "~/data/tax-configs";
import { user } from "./auth-schema";

// Enums
export const documentTypeEnum = ["Quote", "Invoice", "Deal"] as const;
export const quoteStatusEnum = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
] as const;
export const invoiceStatusEnum = [
  "Draft",
  "Sent",
  "Paid",
  "Partially-Paid",
  "Overdue",
  "Cancelled",
] as const;
export const paymentStatusEnum = ["Unpaid", "Partial", "Paid"] as const;

const taxEnum = TAX_CONFIG.map((t) => t.rate.toString()) as [
  string,
  ...string[],
];

// Tables
export const quotes = mysqlTable("quotes", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  quoteNumber: varchar("quote_number", { length: 50 }).notNull().unique(),
  personId: varchar("person_id", { length: 36 }), // Contact person (optional)
  dealId: varchar("deal_id", { length: 36 }),
  ownerId: varchar("owner_id", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  clientId: varchar("client_id", { length: 36 })
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  clientAddress: text("client_address"),
  status: mysqlEnum("quote_status", quoteStatusEnum).notNull().default("Draft"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  interest: decimal("interest", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"), // Interest applied based on payment terms
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  paymentTermId: varchar("payment_term_id", { length: 36 }), // Reference to payment term configuration
  validUntil: timestamp("valid_until"),
  notes: text("notes"),
  poReceived: boolean("po_received").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  personId: varchar("person_id", { length: 36 }), // Contact person (optional)
  dealId: varchar("deal_id", { length: 36 }),
  ownerId: varchar("owner_id", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  quoteId: varchar("quote_id", { length: 36 }),
  clientId: varchar("client_id", { length: 36 }) // who we're billing
    .references(() => companies.id, { onDelete: "cascade" })
    .notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  clientAddress: text("client_address"),
  status: mysqlEnum("invoice_status", invoiceStatusEnum)
    .notNull()
    .default("Draft"),
  paymentStatus: mysqlEnum("payment_status", paymentStatusEnum)
    .notNull()
    .default("Unpaid"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  interest: decimal("interest", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"), // Interest applied based on payment terms
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  paymentTermId: varchar("payment_term_id", { length: 36 }), // Reference to payment term configuration
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const documentItems = mysqlTable("document_items", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  documentType: mysqlEnum("document_type", documentTypeEnum).notNull(),
  documentId: varchar("document_id", { length: 36 }).notNull(),
  description: text("description").notNull(),
  productId: varchar("product_id", { length: 36 }).references(
    () => products.id,
    {
      onDelete: "set null",
    }
  ),
  quantity: decimal("quantity", { precision: 10, scale: 2 })
    .notNull()
    .default("1.00"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0.00"),
  taxRate: mysqlEnum("tax_rate", taxEnum),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  invoiceId: varchar("invoice_id", { length: 36 })
    .references(() => invoices.id, { onDelete: "cascade" })
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  method: varchar("method", { length: 100 }),
  reference: varchar("reference", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
// Relations
export const quotesRelations = relations(quotes, ({ many, one }) => ({
  items: many(documentItems),
  invoice: one(invoices, {
    fields: [quotes.id],
    references: [invoices.quoteId],
  }),
  client: one(companies, {
    fields: [quotes.clientId],
    references: [companies.id],
  }),
  owner: one(user, {
    fields: [quotes.ownerId],
    references: [user.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  items: many(documentItems),
  quote: one(quotes, {
    fields: [invoices.quoteId],
    references: [quotes.id],
  }),
  client: one(companies, {
    fields: [invoices.clientId],
    references: [companies.id],
  }),
  payments: many(payments),
  owner: one(user, {
    fields: [invoices.ownerId],
    references: [user.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const documentItemsRelations = relations(documentItems, ({ one }) => ({
  product: one(products, {
    fields: [documentItems.productId],
    references: [products.id],
  }),
  quote: one(quotes, {
    fields: [documentItems.documentId],
    references: [quotes.id],
  }),
  invoice: one(invoices, {
    fields: [documentItems.documentId],
    references: [invoices.id],
  }),
}));
