import {
  boolean,
  datetime,
  decimal,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { user } from "./auth-schema";
import { relations } from "drizzle-orm";
import { deals } from "./deals-schema";
import { quotes, invoices } from "./accounting-schema";
import { emails } from "./emails-schema";
import { events } from "./events-schema";
import { notes } from "./notes-schema";
import { tasks } from "./tasks-schema";
import { leadTags } from "./tags-schema";
import { leadQualificationCriteria } from "./lead-qualification-schema";
import { PROVINCES, REGIONS } from "~/data/provinces";
import { CHURCH_DENOMINATIONS } from "~/data/church-denominations";

export const leadStatusEnum = [
  "new",
  "contacted",
  "qualified",
  "unqualified",
  "converted",
] as const;
export const leadSourceEnum = [
  "website",
  "referral",
  "cold_call",
  "social_media",
  "event",
  "partner",
  "other",
] as const;
export const activityTypeEnum = [
  "call",
  "email",
  "meeting",
  "note",
  "task",
  "sms",
] as const;
export const activityStatusEnum = [
  "scheduled",
  "completed",
  "cancelled",
  "no_show",
] as const;
export const dealStageEnum = [
  "discovery",
  "proposal",
  "negotiation",
  "closed_won",
  "closed_lost",
] as const;
export const contactRoleEnum = [
  "primary",
  "decision_maker",
  "influencer",
  "technical",
  "financial",
  "end_user",
  "other",
] as const;
// Constants
export const SCHOOL_TYPES = [
  "Primary",
  "Secondary",
  "ECD Centre",
  "College",
  "Other",
] as const;

export const OWNERSHIP_TYPES = [
  "Government",
  "Council School",
  "Mission / Church",
  "Private Independent",
  "Community / SDC",
  "Other",
] as const;

export const leads = mysqlTable(
  "leads",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),

    // Link to company and primary contact
    companyId: varchar("company_id", { length: 36 })
      .references(() => companies.id, { onDelete: "cascade" })
      .notNull(),
    primaryContactId: varchar("primary_contact_id", { length: 36 })
      .references(() => contacts.id, { onDelete: "cascade" })
      .notNull(),

    // Lead metadata
    name: varchar("name", { length: 255 }).notNull(), // e.g., "Q4 Enterprise License Deal"
    status: mysqlEnum("status", leadStatusEnum).notNull().default("new"),
    source: mysqlEnum("source", leadSourceEnum).notNull(),
    estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),

    // Qualification score (0-100)
    qualificationScore: int("qualification_score").default(0),

    // Assignment - nullable to allow unassigned leads
    ownerId: varchar("owner_id", { length: 36 }).references(() => user.id, {
      onDelete: "cascade",
    }),
    emailVerified: boolean("email_verified").default(false),
    phoneNumberVerified: boolean("phoneNumber_verified").default(false),

    createdAt: datetime("created_at").default(new Date()),
    updatedAt: datetime("updated_at")
      .default(new Date())
      .$onUpdate(() => new Date()),

    lastContactedAt: timestamp("last_contacted_at"),
    convertedAt: timestamp("converted_at"),

    // Soft delete
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("company_idx").on(table.companyId),
    index("primary_contact_idx").on(table.primaryContactId),
    index("owner_idx").on(table.ownerId),
    index("status_idx").on(table.status),
    index("created_at_idx").on(table.createdAt),
  ]
);

// Companies/Accounts - the organization
export const companies = mysqlTable(
  "companies",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    name: varchar("name", { length: 255 }).notNull(),
    website: varchar("website", { length: 255 }),
    industry: varchar("industry", { length: 100 }),
    employeeCount: int("employee_count"),
    annualRevenue: decimal("annual_revenue", { precision: 15, scale: 2 }),

    // Address
    addressLine1: varchar("address_line1", { length: 255 }),
    addressLine2: varchar("address_line2", { length: 255 }),
    ownershipType: mysqlEnum("ownership_type", OWNERSHIP_TYPES),
    schoolType: mysqlEnum("school_type", SCHOOL_TYPES),
    churchDenomination: mysqlEnum("church_denomination", CHURCH_DENOMINATIONS),

    region: mysqlEnum("region", REGIONS),
    city: varchar("city", { length: 100 }),
    province: mysqlEnum("province", PROVINCES),
    district: varchar("district", { length: 100 }),
    country: varchar("country", { length: 100 }),

    // Metadata
    description: text("description"),
    ownerId: varchar("owner_id", { length: 36 }).references(() => user.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("name_idx").on(table.name),
    index("owner_idx").on(table.ownerId),
  ]
);

// Contacts - individual people at companies
export const contacts = mysqlTable(
  "contacts",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    companyId: varchar("company_id", { length: 36 }).references(
      () => companies.id,
      { onDelete: "cascade" }
    ),

    title: varchar("title", { length: 100 }),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 50 }),
    mobilePhone: varchar("mobile_phone", { length: 50 }),
    jobTitle: varchar("job_title", { length: 100 }),
    department: varchar("department", { length: 100 }),

    // Social profiles
    linkedinUrl: varchar("linkedin_url", { length: 255 }),
    twitterHandle: varchar("twitter_handle", { length: 100 }),

    // Preferences
    preferredContactMethod: mysqlEnum("preferred_contact_method", [
      "email",
      "phone",
      "sms",
      "linkedin",
    ]),
    doNotCall: boolean("do_not_call").default(false),
    doNotEmail: boolean("do_not_email").default(false),

    // Metadata
    notes: text("notes"),
    ownerId: varchar("owner_id", { length: 36 }).references(() => user.id, {
      onDelete: "cascade",
    }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [
    index("email_idx").on(table.email),
    index("company_idx").on(table.companyId),
    index("owner_idx").on(table.ownerId),
    unique("unique_contact").on(
      table.firstName,
      table.lastName,
      table.companyId
    ),
  ]
);

// Junction table: which contacts are involved in which leads
export const leadContacts = mysqlTable(
  "lead_contacts",
  {
    leadId: varchar("lead_id", { length: 36 })
      .references(() => leads.id, { onDelete: "cascade" })
      .notNull(),
    contactId: varchar("contact_id", { length: 36 })
      .references(() => contacts.id, { onDelete: "cascade" })
      .notNull(),
    role: mysqlEnum("role", contactRoleEnum).notNull(),
    isPrimary: boolean("is_primary").default(false),
    notes: text("notes"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.leadId, table.contactId] }),
    index("lead_idx").on(table.leadId),
    index("contact_idx").on(table.contactId),
  ]
);

// Activities - now linked to both lead AND specific contact
export const leadActivities = mysqlTable(
  "lead_activities",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    leadId: varchar("lead_id", { length: 36 }).notNull(),

    // Optional deal reference - activity may not be tied to a specific deal yet
    dealId: varchar("deal_id", { length: 36 }).references(() => deals.id, {
      onDelete: "set null",
    }),

    contactId: varchar("contact_id", { length: 36 }), // Which contact was involved

    type: mysqlEnum("type", activityTypeEnum).notNull(),
    status: mysqlEnum("status", activityStatusEnum)
      .notNull()
      .default("scheduled"),

    subject: varchar("subject", { length: 255 }).notNull(),
    description: text("description"),

    // Scheduling
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    duration: int("duration"), // minutes

    // Owner
    createdBy: varchar("created_by", { length: 36 })
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    assignedTo: varchar("assigned_to", { length: 36 }).references(
      () => user.id,
      { onDelete: "cascade" }
    ),

    // Timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("lead_idx").on(table.leadId),
    index("contact_idx").on(table.contactId),
    index("created_by_idx").on(table.createdBy),
    index("scheduled_at_idx").on(table.scheduledAt),
    index("status_idx").on(table.status),
    index("lead_deal_idx").on(table.leadId, table.dealId),
  ]
);

export const leadRelations = relations(leads, ({ one, many }) => ({
  company: one(companies, {
    fields: [leads.companyId],
    references: [companies.id],
  }),
  primaryContact: one(contacts, {
    fields: [leads.primaryContactId],
    references: [contacts.id],
  }),
  contactAssociations: many(leadContacts),
  activities: many(leadActivities),
  qualification: one(leadQualificationCriteria, {
    fields: [leads.id],
    references: [leadQualificationCriteria.leadId],
  }),
  deals: many(deals),
  assignee: one(user, {
    fields: [leads.ownerId],
    references: [user.id],
  }),
  tagAssociations: many(leadTags),
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
  company: one(companies, {
    fields: [contacts.companyId],
    references: [companies.id],
  }),
  primaryLeads: many(leads),
  leadAssociations: many(leadContacts),
  activities: many(leadActivities),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  persons: many(contacts),
  deals: many(deals),
  leads: many(leads),
  quotes: many(quotes),
  invoices: many(invoices),
}));

export const LeadContactRelations = relations(leadContacts, ({ one }) => ({
  lead: one(leads, {
    fields: [leadContacts.leadId],
    references: [leads.id],
  }),
  contact: one(contacts, {
    fields: [leadContacts.contactId],
    references: [contacts.id],
  }),
}));

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
  deal: one(deals, {
    fields: [leadActivities.dealId],
    references: [deals.id],
  }),
  contact: one(contacts, {
    fields: [leadActivities.contactId],
    references: [contacts.id],
  }),
  assignedToUser: one(user, {
    fields: [leadActivities.assignedTo],
    references: [user.id],
  }),
  createdByUser: one(user, {
    fields: [leadActivities.createdBy],
    references: [user.id],
  }),
  email: one(emails, {
    fields: [leadActivities.id],
    references: [emails.activityId],
  }),
  note: one(notes, {
    fields: [leadActivities.id],
    references: [notes.activityId],
  }),
  task: one(tasks, {
    fields: [leadActivities.id],
    references: [tasks.activityId],
  }),
  meeting: one(events, {
    fields: [leadActivities.id],
    references: [events.activityId],
  }),
}));
