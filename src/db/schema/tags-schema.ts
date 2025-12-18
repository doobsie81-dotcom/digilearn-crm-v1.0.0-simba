import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  primaryKey,
  index,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { relations } from "drizzle-orm";
import { leads } from "./leads-schema";
import { deals } from "./deals-schema";
import { user } from "./auth-schema";

// Tags table
export const tags = mysqlTable(
  "tags",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 100 }).notNull(),
    color: varchar("color", { length: 7 }).notNull(), // hex color code e.g. #FF5733
    description: text("description"),

    // Track who created the tag
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
    index("name_idx").on(table.name),
    index("created_by_idx").on(table.createdBy),
  ]
);

// Junction table: Lead-Tags
export const leadTags = mysqlTable(
  "lead_tags",
  {
    leadId: varchar("lead_id", { length: 36 })
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    tagId: varchar("tag_id", { length: 36 })
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),

    // Track when tag was added
    addedAt: timestamp("added_at").notNull().defaultNow(),
    addedBy: varchar("added_by", { length: 36 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.leadId, table.tagId] }),
    index("lead_idx").on(table.leadId),
    index("tag_idx").on(table.tagId),
  ]
);

// Junction table: Deal-Tags
export const dealTags = mysqlTable(
  "deal_tags",
  {
    dealId: varchar("deal_id", { length: 36 })
      .references(() => deals.id, { onDelete: "cascade" })
      .notNull(),
    tagId: varchar("tag_id", { length: 36 })
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),

    // Track when tag was added
    addedAt: timestamp("added_at").notNull().defaultNow(),
    addedBy: varchar("added_by", { length: 36 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.dealId, table.tagId] }),
    index("deal_idx").on(table.dealId),
    index("tag_idx").on(table.tagId),
  ]
);

// Relations
export const tagsRelations = relations(tags, ({ many }) => ({
  leadTags: many(leadTags),
  dealTags: many(dealTags),
}));

export const leadTagsRelations = relations(leadTags, ({ one }) => ({
  lead: one(leads, {
    fields: [leadTags.leadId],
    references: [leads.id],
  }),
  tag: one(tags, {
    fields: [leadTags.tagId],
    references: [tags.id],
  }),
}));

export const dealTagsRelations = relations(dealTags, ({ one }) => ({
  deal: one(deals, {
    fields: [dealTags.dealId],
    references: [deals.id],
  }),
  tag: one(tags, {
    fields: [dealTags.tagId],
    references: [tags.id],
  }),
}));
