import {
  mysqlTable,
  text,
  varchar,
  int,
  timestamp,
  mysqlEnum,
  boolean,
  json,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { deals } from "./deals-schema";
import { relations } from "drizzle-orm";

export const escalationSeverityEnum = mysqlEnum("escalation_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Enum for rule violation types
export const ruleViolationTypeEnum = mysqlEnum("rule_violation_type", [
  "sla_breach",
  "deadline_approaching",
  "task_overdue",
  "approval_pending",
]);

// Pipeline Stages
export const PipelineStageSchema = mysqlTable("pipeline_stages", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  status: varchar("status", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  order: int("order").notNull().unique(),
  color: text("color").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  stageProbability: int("stage_probability", { unsigned: true }).notNull(),

  // SLA Configuration
  slaHours: int("sla_hours"), // Time limit in hours
  slaDays: int("sla_days"), // Time limit in business days
  requiresAction: boolean("requires_action").default(false), // Must complete action
  actionDescription: text("action_description"),

  // Escalation Rules
  escalationTarget: text("escalation_target"), // Who to escalate to
  escalationMessage: text("escalation_message"), // Escalation message template
  autoReminderEnabled: boolean("auto_reminder_enabled").default(false),
  reminderIntervalHours: int("reminder_interval_hours"),

  requiredFields: json("required_fields").$type<string[]>(), // Fields that must be filled
  preventProgressWithout: text("prevent_progress_without"), // Block if requirement not met
  autoReassignOnViolation: boolean("auto_reassign_on_violation").default(false),
});

export const pipelinesRelations = relations(
  PipelineStageSchema,
  ({ many }) => ({
    deals: many(deals),
  })
);
