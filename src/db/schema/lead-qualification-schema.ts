import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  int,
  mysqlEnum,
  boolean,
  json,
  decimal,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { relations } from "drizzle-orm";
import { leads } from "./leads-schema";

// Plan type options
export const planTypeEnum = ["cash", "3-term", "6-term", "9-term"] as const;

// Timeline type options
export const timelineTypeEnum = [
  "this-term",
  "next-term",
  "specific-date",
  "ready-to-proceed",
  "sdc-meets-end-of-this-term",
  "sdc-meets-next-term",
  "need-more-information",
  "budget-approval-pending",
] as const;

// Budget indicator options
export const budgetIndicatorEnum = [
  "high",
  "medium",
  "low",
  "not-disclosed",
] as const;

// Decision team member type
export type DecisionTeamMember = {
  name: string;
  role: string;
  isPrimary?: boolean; // for Head and Bursar
};

// Lead Qualification Criteria table
export const leadQualificationCriteria = mysqlTable(
  "lead_qualification_criteria",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    leadId: varchar("lead_id", { length: 36 })
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull()
      .unique(),

    // Decision Team - auto-populated from lead contacts
    hasInfluentialContact: boolean("has_influential_contact").default(false),

    // Product Needs - dynamic text field
    needs: text("needs"), // Free-form description of needs
    hasNeeds: boolean("has_needs").default(false),

    // Plan Type
    planType: mysqlEnum("plan_type", planTypeEnum),
    hasPlanType: boolean("has_plan_type").default(false),

    // Timeline
    timelineType: mysqlEnum("timeline_type", timelineTypeEnum),
    specificDate: timestamp("specific_date"),
    hasTimeline: boolean("has_timeline").default(false),

    // Budget/Appetite
    budgetIndicator: mysqlEnum("budget_indicator", budgetIndicatorEnum),
    budgetAmount: decimal("budget_amount", { precision: 15, scale: 2 }),
    hasBudget: boolean("has_budget").default(false),

    // Contact Verification - derived from lead data
    phoneVerified: boolean("phone_verified").default(false),
    emailVerified: boolean("email_verified").default(false),
    provinceVerified: boolean("province_verified").default(false),
    hasVerifiedContact: boolean("has_verified_contact").default(false),

    // Completion tracking
    completionPercentage: int("completion_percentage").default(0),
    isQualified: boolean("is_qualified").default(false), // true if >= 75%

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  }
);

// Relations
export const leadQualificationCriteriaRelations = relations(
  leadQualificationCriteria,
  ({ one }) => ({
    lead: one(leads, {
      fields: [leadQualificationCriteria.leadId],
      references: [leads.id],
    }),
  })
);
