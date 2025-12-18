import {
  datetime,
  int,
  mysqlTable,
  varchar,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { relations } from "drizzle-orm";
import { leads } from "./leads-schema";

export const raffles = mysqlTable("raffles", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),

  title: varchar("title", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export const raffleEntries = mysqlTable(
  "raffle_entries",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    raffleId: varchar("raffle_id", { length: 36 })
      .references(() => raffles.id, { onDelete: "cascade" })
      .notNull(),

    leadId: varchar("lead_id", { length: 36 })
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),

    ticketNumber: int("ticket_number").notNull(),

    entryDate: timestamp("entry_date").notNull().defaultNow(),
  },
  (table) => ({
    raffleTicketIdx: uniqueIndex("raffle_ticket_idx").on(
      table.raffleId,
      table.ticketNumber
    ),
  })
);

// Relations
export const rafflesRelations = relations(raffles, ({ many }) => ({
  entries: many(raffleEntries),
}));

export const raffleEntriesRelations = relations(raffleEntries, ({ one }) => ({
  raffle: one(raffles, {
    fields: [raffleEntries.raffleId],
    references: [raffles.id],
  }),
  lead: one(leads, {
    fields: [raffleEntries.leadId],
    references: [leads.id],
  }),
}));
