import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { relations } from "drizzle-orm";
import { leads } from "./leads-schema";
import { deals } from "./deals-schema";
import { contacts } from "./leads-schema";
import { user } from "./auth-schema";

export const callTypeEnum = ["call", "whatsapp", "email"] as const;

// Call outcomes table
export const callOutcomes = mysqlTable(
  "call_outcomes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 100 }).notNull(),
    variant: mysqlEnum("variant", ["success", "warning", "default"]).default(
      "default"
    ),
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("name_idx").on(table.name)]
);

// Calls table
export const calls = mysqlTable(
  "calls",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    // Relationships
    leadId: varchar("lead_id", { length: 36 }).references(() => leads.id, {
      onDelete: "cascade",
    }),
    dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "cascade",
    }),
    contactId: varchar("contact_id", { length: 36 })
      .references(() => contacts.id, { onDelete: "cascade" })
      .notNull(),
    outcomeId: varchar("outcome_id", { length: 36 }).references(
      () => callOutcomes.id,
      { onDelete: "set null" }
    ),

    // Call details
    type: mysqlEnum("type", callTypeEnum).notNull().default("call"),
    summary: text("summary").notNull(),
    nextSteps: text("next_steps").notNull(),
    dueDateTime: timestamp("due_date_time"),

    // Status
    isDraft: boolean("is_draft").default(false).notNull(),
    status: varchar("status", { length: 50 }).default("completed").notNull(),

    // Metadata
    createdBy: varchar("created_by", { length: 36 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lead_idx").on(table.leadId),
    index("deal_idx").on(table.dealId),
    index("contact_idx").on(table.contactId),
    index("created_by_idx").on(table.createdBy),
    index("created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const callsRelations = relations(calls, ({ one }) => ({
  lead: one(leads, {
    fields: [calls.leadId],
    references: [leads.id],
  }),
  deal: one(deals, {
    fields: [calls.dealId],
    references: [deals.id],
  }),
  contact: one(contacts, {
    fields: [calls.contactId],
    references: [contacts.id],
  }),
  outcome: one(callOutcomes, {
    fields: [calls.outcomeId],
    references: [callOutcomes.id],
  }),
  creator: one(user, {
    fields: [calls.createdBy],
    references: [user.id],
  }),
}));

export const callOutcomesRelations = relations(callOutcomes, ({ many }) => ({
  calls: many(calls),
}));
