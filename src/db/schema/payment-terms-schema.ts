import {
  mysqlTable,
  varchar,
  decimal,
  timestamp,
  mysqlEnum,
  text,
  int,
  boolean,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Payment term types
export const paymentTermTypeEnum = [
  "cash",          // Immediate payment, 0% interest
  "3-term",        // 3 payment periods
  "4-term",        // 4 payment periods
  "6-term",        // 6 payment periods
  "9-term",        // 9 payment periods
  "custom-date",   // Payment by specific date
  "net-30",        // Net 30 days
  "net-60",        // Net 60 days
  "net-90",        // Net 90 days
  "custom",        // Fully customizable payment plan
] as const;

/**
 * Payment Terms Configuration
 * Defines payment terms that can be applied to invoices and quotes
 */
export const paymentTerms = mysqlTable("payment_terms", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),

  // Term identification
  name: varchar("name", { length: 100 }), // Required for custom plans, optional for predefined types
  type: mysqlEnum("type", paymentTermTypeEnum).notNull(),

  // Financial configuration
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 })
    .notNull()
    .default("0.00"), // Interest rate as percentage (e.g., 2.50 for 2.5%)

  // Term periods (for term-based payments)
  numberOfTerms: int("number_of_terms"), // Number of payment periods
  termLengthDays: int("term_length_days"), // Length of each term in days (e.g., 30 for monthly)

  // Date-based configuration
  daysUntilDue: int("days_until_due"), // Days until payment due (for net-X and custom-date)

  // Terms and conditions
  termsAndConditions: text("terms_and_conditions"), // Legal terms for this payment option
  description: text("description"), // User-friendly description

  // Status and visibility
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Default selection
  displayOrder: int("display_order").notNull().default(0), // Order in UI

  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

/**
 * Applied Payment Terms
 * Tracks which payment terms were applied to specific documents
 * This creates an audit trail even if payment terms are later modified
 */
export const appliedPaymentTerms = mysqlTable("applied_payment_terms", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),

  // Document reference
  documentId: varchar("document_id", { length: 36 }).notNull(),
  documentType: mysqlEnum("document_type", ["Invoice", "Quote"]).notNull(),

  // Snapshot of payment terms at time of application
  paymentTermId: varchar("payment_term_id", { length: 36 })
    .references(() => paymentTerms.id, { onDelete: "set null" }),
  termName: varchar("term_name", { length: 100 }).notNull(),
  termType: mysqlEnum("term_type", paymentTermTypeEnum).notNull(),

  // Financial snapshot
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0.00"), // Calculated interest on subtotal

  // Term details snapshot
  numberOfTerms: int("number_of_terms"),
  termLengthDays: int("term_length_days"),
  daysUntilDue: int("days_until_due"),

  // Due date calculation
  dueDate: timestamp("due_date"),

  // Terms and conditions snapshot
  termsAndConditions: text("terms_and_conditions"),

  // Calculation breakdown (stored as JSON for audit)
  calculationBreakdown: text("calculation_breakdown"), // JSON string of calculation steps

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

// Relations
export const paymentTermsRelations = relations(paymentTerms, ({ many }) => ({
  appliedTerms: many(appliedPaymentTerms),
}));

export const appliedPaymentTermsRelations = relations(appliedPaymentTerms, ({ one }) => ({
  paymentTerm: one(paymentTerms, {
    fields: [appliedPaymentTerms.paymentTermId],
    references: [paymentTerms.id],
  }),
}));
