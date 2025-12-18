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

export const notes = mysqlTable(
  "notes",
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

    content: text("content").notNull(),
    tags: varchar("tags", { length: 255 }),

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
  ]
);

export const notesRelations = relations(notes, ({ one }) => ({
  activity: one(leadActivities, {
    fields: [notes.activityId],
    references: [leadActivities.id],
    relationName: "leadActivites",
  }),
}));
