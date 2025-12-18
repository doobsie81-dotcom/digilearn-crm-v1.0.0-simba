import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  index,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { leadActivities, leads } from "./leads-schema";
import { deals } from "./deals-schema";
import { user } from "./auth-schema";

export const emails = mysqlTable(
  "emails",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    activityId: varchar("activity_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => leadActivities.id, { onDelete: "cascade" }),

    // DENORMALIZED: Direct references
    leadId: varchar("lead_id", { length: 36 })
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),

    dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "set null",
    }),
    composerId: varchar("composer_id", { length: 36 }).references(
      () => user.id,
      {
        onDelete: "set null",
      }
    ),

    body: text("body").notNull(),
    recipients: text("recipients").notNull(),
    subject: varchar("recipients", { length: 255 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("activity_idx").on(table.activityId),
    index("lead_idx").on(table.leadId),
    index("deal_idx").on(table.dealId),
    index("lead_deal_idx").on(table.leadId, table.dealId),
    index("userl_idx").on(table.composerId),
  ]
);

export const emailsRelations = relations(emails, ({ one }) => ({
  activity: one(leadActivities, {
    fields: [emails.activityId],
    references: [leadActivities.id],
    relationName: "leadActivites",
  }),
  composer: one(user, {
    fields: [emails.activityId],
    references: [user.id],
    relationName: "composer",
  }),
}));
