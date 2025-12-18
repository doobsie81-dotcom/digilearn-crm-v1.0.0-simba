import {
  mysqlTable,
  varchar,
  timestamp,
  int,
  text,
  boolean,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import {
  ruleViolationTypeEnum,
  escalationSeverityEnum,
} from "./pipelines-schema";
import { deals } from "./deals-schema";

export const slaViolationSchema = mysqlTable("sla_violations", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  dealId: varchar("deal_id", { length: 36 })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  stageStatus: varchar("stage_status", { length: 255 }).notNull(),
  violationType: ruleViolationTypeEnum,
  severity: escalationSeverityEnum,

  description: text("description").notNull(),
  expectedBy: timestamp("expected_by").notNull(),
  actualViolationTime: timestamp("actual_violation_time").notNull(),
  hoursOverdue: int("hours_overdue").notNull(),

  // Escalation tracking
  escalated: boolean("escalated").default(false),
  escalatedTo: text("escalated_to"),
  escalatedAt: timestamp("escalated_at"),
  resolved: boolean("resolved").default(false),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by"),
  resolutionNotes: text("resolution_notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});
