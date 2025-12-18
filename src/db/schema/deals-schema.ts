import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  decimal,
  boolean,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import {
  companies,
  contacts,
  leadActivities,
  leads,
} from "./leads-schema";
import { user } from "./auth-schema";
import { relations } from "drizzle-orm";
import { slaViolationSchema } from "./sla-violations-schema";
import { PipelineStageSchema } from "./pipelines-schema";
import { invoices, quotes } from "./accounting-schema";
import { dealTags } from "./tags-schema";

// to track deal status (win / lose).
// to also track deal status using a separate table (track actions by agent)
// to link deal to a lead.

const competitorStatus = ["active", "eliminated", "unknown"] as const;
const competitorStatusEnum = mysqlEnum(competitorStatus).default("active");
export const closeStatusEnum = ["ongoing", "won", "lost"] as const;
export const contactFrequencyEnum = [
  "daily",
  "every-two-days",
  "weekly",
  "fortnightly",
  "monthly",
] as const;

export const deals = mysqlTable("deals", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  leadId: varchar("lead_id", { length: 36 })
    .notNull()
    .references(() => leads.id, { onDelete: "cascade" }),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  value: decimal("value", { precision: 12, scale: 2 }).notNull(), // Total deal value
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  currentStatus: varchar("current_status", { length: 255 }).notNull(),
  currentStageId: varchar("current_stage_id", { length: 36 })
    .notNull()
    .references(() => PipelineStageSchema.id, { onDelete: "cascade" }),
  currentStageSince: timestamp("current_stage_since").defaultNow().notNull(), // When entered current stage

  probability: int("probability").default(0).notNull(), // 0-100
  position: int("position").default(1000).notNull(), // 1000-1_000_000
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  closeStatus: mysqlEnum("close_status", closeStatusEnum).default("ongoing"),
  lostReason: text("lost_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),

  // Assignment & Ownership
  assignedTo: varchar("assigned_to", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }), // Sales rep responsible
  assignedToEmail: text("assigned_to_email"),
  managerEmail: text("manager_email"),
  healthScore: int("health_score").default(0).notNull(),
  healthScoreStakeholderEngagement: int("health_score_stakeholder_engagement")
    .default(0)
    .notNull(),
  healthScoreTiming: int("health_score_timing").default(0).notNull(),
  healthScoreCompetition: int("health_score_competition").default(0).notNull(),
  healthScoreBudget: int("health_score_budget").default(0).notNull(),
  healthScoreLastCalculated: timestamp("health_score_last_calculated"),
});

export const dealStageHistorySchema = mysqlTable("deal_stage_history", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  dealId: varchar("deal_id", { length: 36 })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 255 }),
  toStatus: varchar("to_status", { length: 255 }).notNull(),
  notes: text("notes"),
  movedBy: varchar("moved_by", { length: 255 }).notNull(),
  movedById: varchar("moved_by_id", { length: 36 }).references(() => user.id, {
    onDelete: "set null",
  }),
  movedAt: timestamp("moved_at").defaultNow().notNull(),

  // SLA tracking for this stage
  slaCompliant: boolean("sla_compliant").default(true),
  timeInStage: int("time_in_stage"), // Hours spent in stage
  slaDeadlineWas: timestamp("sla_deadline_was"),
});

// Health Score History for tracking changes over time
export const dealHealthHistory = mysqlTable("deal_health_history", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  dealId: varchar("deal_id", { length: 36 })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),

  overallScore: int("overall_score").notNull(),
  stakeholderEngagement: int("stakeholder_engagement").notNull(),
  timing: int("timing").notNull(),
  competition: int("competition").notNull(),
  budget: int("budget").notNull(),

  notes: text("notes"),
  calculatedBy: text("calculated_by"), // 'system' or user ID

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stakeholder tracking for engagement scoring
export const dealStakeholders = mysqlTable("deal_stakeholders", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  dealId: varchar("deal_id", { length: 36 })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),
  contactId: varchar("contact_id", { length: 36 })
    .notNull()
    .references(() => contacts.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'decision_maker', 'influencer', 'champion', 'blocker', 'end_user'
  influence: int("influence").notNull().default(50), // 0-100, how much influence they have
  sentiment: text("sentiment").default("neutral"), // 'champion', 'positive', 'neutral', 'negative', 'blocker'

  lastContactedAt: timestamp("last_contacted_at"),
  contactFrequency: mysqlEnum(
    "contact_frequency",
    contactFrequencyEnum
  ).default("weekly"), // Number of touchpoints
  engaged: boolean("engaged").default(false),
  notes: text("notes"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Competition tracking for competitive analysis
export const dealCompetitors = mysqlTable("deal_competitors", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  dealId: varchar("deal_id", { length: 36 })
    .notNull()
    .references(() => deals.id, { onDelete: "cascade" }),

  competitorName: text("competitor_name").notNull(),
  competitorStrength: int("competitor_strength").default(50), // 0-100
  ourAdvantage: text("our_advantage"),
  theirAdvantage: text("their_advantage"),
  status: competitorStatusEnum,
  notes: text("notes"),
  identifiedAt: timestamp("identified_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dealsRelations = relations(deals, ({ one, many }) => ({
  lead: one(leads, {
    fields: [deals.leadId],
    references: [leads.id],
  }),
  quote: one(quotes, {
    fields: [deals.id],
    references: [quotes.dealId]
  }),
  invoice: one(invoices, {
    fields: [deals.id],
    references: [invoices.dealId]
  }),
  activities: many(leadActivities),
  pipelineStage: one(PipelineStageSchema, {
    fields: [deals.currentStageId],
    references: [PipelineStageSchema.id],
  }),
  assignedTo: one(user, {
    fields: [deals.assignedTo],
    references: [user.id],
  }),
  company: one(companies, {
    fields: [deals.companyId],
    references: [companies.id],
  }),
  stageHistory: many(dealStageHistorySchema),
  healthHistory: many(dealHealthHistory),
  stakeholders: many(dealStakeholders),
  competitors: many(dealCompetitors),
  violations: many(slaViolationSchema),
  tagAssociations: many(dealTags),
}));

export const dealHealthHistoryRelations = relations(
  dealHealthHistory,
  ({ one }) => ({
    deal: one(deals, {
      fields: [dealHealthHistory.dealId],
      references: [deals.id],
    }),
  })
);

export const dealStakeholdersRelations = relations(
  dealStakeholders,
  ({ one }) => ({
    deal: one(deals, {
      fields: [dealStakeholders.dealId],
      references: [deals.id],
    }),
    contact: one(contacts, {
      fields: [dealStakeholders.contactId],
      references: [contacts.id],
    }),
  })
);

export const dealCompetitorsRelations = relations(
  dealCompetitors,
  ({ one }) => ({
    deal: one(deals, {
      fields: [dealCompetitors.dealId],
      references: [deals.id],
    }),
  })
);

export const dealStageHistoryRelations = relations(
  dealStageHistorySchema,
  ({ one }) => ({
    deal: one(deals, {
      fields: [dealStageHistorySchema.dealId],
      references: [deals.id],
    }),
    movedByUser: one(user, {
      fields: [dealStageHistorySchema.movedById],
      references: [user.id],
    }),
  })
);
