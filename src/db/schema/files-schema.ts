import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  bigint,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { relations } from "drizzle-orm";
import { leads } from "./leads-schema";
import { deals } from "./deals-schema";
import { user } from "./auth-schema";

export const fileTypeEnum = [
  "image",
  "pdf",
  "document",
  "spreadsheet",
  "other",
] as const;

// Files table
export const files = mysqlTable(
  "files",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    // File details
    name: varchar("name", { length: 255 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    url: text("url").notNull(),
    size: bigint("size", { mode: "number" }).notNull(), // Size in bytes
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    type: mysqlEnum("type", fileTypeEnum).notNull(),

    // Relationships
    leadId: varchar("lead_id", { length: 36 }).references(() => leads.id, {
      onDelete: "cascade",
    }),
    dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "cascade",
    }),

    // Metadata
    uploadedBy: varchar("uploaded_by", { length: 36 })
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
    index("uploaded_by_idx").on(table.uploadedBy),
    index("created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const filesRelations = relations(files, ({ one }) => ({
  lead: one(leads, {
    fields: [files.leadId],
    references: [leads.id],
  }),
  deal: one(deals, {
    fields: [files.dealId],
    references: [deals.id],
  }),
  uploader: one(user, {
    fields: [files.uploadedBy],
    references: [user.id],
  }),
}));
