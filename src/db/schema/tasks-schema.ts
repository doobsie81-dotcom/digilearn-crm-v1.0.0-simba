import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  index,
  int,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { user } from "./auth-schema";
import { leadActivities, leads } from "./leads-schema";
import { deals } from "./deals-schema";

// Enum for task status
export const taskStatusEnum = [
  "todo",
  "in-progress",
  "done",
  "backlog",
] as const;

// Enum for task reference type
export const taskReferenceTypeEnum = ["lead", "deal"] as const;

export const tasks = mysqlTable(
  "tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", taskStatusEnum).notNull().default("todo"),
    position: int("position").notNull(),

    activityId: varchar("activity_id", { length: 36 })
      .notNull()
      .unique()
      .references(() => leadActivities.id, { onDelete: "cascade" }),

    // Polymorphic reference fields
    leadId: varchar("lead_id", { length: 36 }).references(() => leads.id, {
      onDelete: "cascade",
    }),
    dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "cascade",
    }),

    dueDate: timestamp("due_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
  },
  (table) => [
    index("lead_idx").on(table.leadId),
    index("deal_idx").on(table.dealId),
    index("activity_idx").on(table.activityId),
    index("status_idx").on(table.status),
  ]
);

export const taskComments = mysqlTable("task_comments", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  taskId: varchar("taskId", { length: 36 }).references(() => tasks.id, {
    onDelete: "cascade",
  }),
  comment: text("comment").notNull(),
  commentedBy: varchar("commented_by", { length: 255 })
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull().onUpdateNow(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  activity: one(leadActivities, {
    fields: [tasks.activityId],
    references: [leadActivities.id],
    relationName: "leadActivites",
  }),
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  commentedByUser: one(user, {
    fields: [taskComments.commentedBy],
    references: [user.id],
  }),
}));
