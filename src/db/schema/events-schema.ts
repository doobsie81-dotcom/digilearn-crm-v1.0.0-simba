import {
  mysqlTable,
  varchar,
  text,
  datetime,
  timestamp,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { deals } from "./deals-schema";
import { leadActivities, leads } from "./leads-schema";
import { relations } from "drizzle-orm";

export const platformEnum = [
  "zoom",
  "teams",
  "google_meet",
  "in_person",
] as const;


export const events = mysqlTable("events", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  title: varchar("title", { length: 255 }).notNull(),
  activityId: varchar("activity_id", { length: 36 })
    .notNull()
    .unique()
    .references(() => leadActivities.id, { onDelete: "cascade" }),

  leadId: varchar("lead_id", { length: 36 }).references(() => leads.id, {
    onDelete: "set null",
  }),
  // Optional deal reference - activity may not be tied to a specific deal yet
  dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
    onDelete: "set null",
  }),
  description: text("description"),
  startDate: datetime("start_date").notNull(),
  endDate: datetime("end_date").notNull(),
  platform: mysqlEnum("platform", platformEnum).notNull(),
  location: varchar("location", { length: 255 }),
  attendees: text("attendees"),
  agenda: text("agenda"),
  meetingLink: text("meeting_link"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at"),
});

// // Join table for event attendees (many-to-many relationship)
// export const EventAttendeeSchema = mysqlTable("event_attendees", {
//   id: varchar("id", { length: 36 })
//     .primaryKey()
//     .$defaultFn(() => uuidv4()),
//   eventId: varchar("event_id", { length: 36 })
//     .notNull()
//     .references(() => events.id, { onDelete: "cascade" }),
//   email: varchar("email", { length: 255 }).notNull(),
//   isOrganizer: boolean("is_organizer").default(false).notNull(),
//   responseStatus: varchar("response_status", { length: 50 }).default("pending"), // pending, accepted, declined, tentative
// });

export const eventsRelations = relations(events, ({ one }) => ({
  activity: one(leadActivities, {
    fields: [events.activityId],
    references: [leadActivities.id],
    relationName: "leadActivites",
  }),
}));
