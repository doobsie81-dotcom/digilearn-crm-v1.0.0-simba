import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { db } from "./";
import * as schema from "./schema";

/**
 * Type for database executor that can be either:
 * - The main db instance
 * - A transaction context
 *
 * This type preserves the schema information, allowing
 * db.query.tableName to work correctly in services
 */
export type DbExecutor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Helper type to extract the transaction type
 * Use this if you need to explicitly type a transaction parameter
 */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// User types
export type User = InferSelectModel<typeof schema.user>;
export type NewUser = InferInsertModel<typeof schema.user>;

// Session types
export type Session = InferSelectModel<typeof schema.session>;
export type NewSession = InferInsertModel<typeof schema.session>;

// Account types
export type Account = InferSelectModel<typeof schema.account>;
export type NewAccount = InferInsertModel<typeof schema.account>;

// Verification types
export type Verification = InferSelectModel<typeof schema.verification>;
export type NewVerification = InferInsertModel<typeof schema.verification>;

// Settings types
export type Setting = InferSelectModel<typeof schema.SettingSchema>;
export type NewSetting = InferInsertModel<typeof schema.SettingSchema>;

// Lead types
export type Lead = InferSelectModel<typeof schema.leads>;
export type NewLead = InferInsertModel<typeof schema.leads>;

// Lead activity types
export type LeadActivity = InferSelectModel<typeof schema.leadActivities>;
export type NewLeadActivity = InferInsertModel<typeof schema.leadActivities>;

// Contact types
export type Contact = InferSelectModel<typeof schema.contacts>;
export type NewContact = InferInsertModel<typeof schema.contacts>;

// Contact types
export type LeadContact = InferSelectModel<typeof schema.leadContacts>;
export type NewLeadContact = InferInsertModel<typeof schema.leadContacts>;

// Event types
export type Event = InferSelectModel<typeof schema.events>;
export type NewEvent = InferInsertModel<typeof schema.events>;

// Notes types
export type Note = InferSelectModel<typeof schema.notes>;
export type NewNote = InferInsertModel<typeof schema.notes>;

// Email types
export type Email = InferSelectModel<typeof schema.emails>;
export type NewEmail = InferInsertModel<typeof schema.emails>;

// // EventAttendee types
// export type EventAttendee = InferSelectModel<typeof schema.EventAttendeeSchema>;
// export type NewEventAttendee = InferInsertModel<
//   typeof schema.EventAttendeeSchema
// >;

// Deal types
export type Deal = InferSelectModel<typeof schema.deals>;
export type NewDeal = InferInsertModel<typeof schema.deals>;

// Deal Stage History types
export type DealStageHistory = InferSelectModel<
  typeof schema.dealStageHistorySchema
>;
export type NewDealStageHistory = InferInsertModel<
  typeof schema.dealStageHistorySchema
>;

// SLA Violation types
export type SLAViolation = InferSelectModel<typeof schema.slaViolationSchema>;
export type NewSLAViolation = InferInsertModel<
  typeof schema.slaViolationSchema
>;

// Pipeline Stage types
export type PipelineStage = InferSelectModel<typeof schema.PipelineStageSchema>;
export type NewPipelineStage = InferInsertModel<
  typeof schema.PipelineStageSchema
>;

// Deal Health History types
export type DealHealthHistory = InferSelectModel<
  typeof schema.dealHealthHistory
>;
export type NewDealHealthHistory = InferInsertModel<
  typeof schema.dealHealthHistory
>;

// Deal Stakeholder types
export type DealStakeholder = InferSelectModel<typeof schema.dealStakeholders>;
export type NewDealStakeholder = InferInsertModel<
  typeof schema.dealStakeholders
>;

// Deal Competitor types
export type DealCompetitor = InferSelectModel<typeof schema.dealCompetitors>;
export type NewDealCompetitor = InferInsertModel<typeof schema.dealCompetitors>;

// Extended Deal type with relations
export type DealWithRelations = Deal & {
  lead?: Lead;
  pipelineStage?: PipelineStage;
  assignedTo?: User;
  stageHistory?: DealStageHistory[];
  healthHistory?: DealHealthHistory[];
  stakeholders?: DealStakeholder[];
  competitors?: DealCompetitor[];
  violations?: SLAViolation[];
};

export interface DealHealthScore {
  score: number;
  factors: {
    stakeholderEngagement: number;
    timing: number;
    competition: number;
    budget: number;
  };
  lastCalculated: string;
}

export interface DealStakeholderWithRelations extends DealStakeholder {
  deal?: Deal;
}

export interface DealCompetitorWithRelations extends DealCompetitor {
  deal?: Deal;
}

export interface DealHealthHistoryWithRelations extends DealHealthHistory {
  deal?: Deal;
}

// invoices types
export type Invoice = InferSelectModel<typeof schema.invoices>;
export type NewInvoice = InferInsertModel<typeof schema.invoices>;

// quote types
export type Quote = InferSelectModel<typeof schema.quotes>;
export type NewQuote = InferInsertModel<typeof schema.quotes>;

// payment types
export type Payment = InferSelectModel<typeof schema.payments>;
export type NewPayment = InferInsertModel<typeof schema.payments>;

// product types
export type Product = InferSelectModel<typeof schema.products>;
export type NewProduct = InferInsertModel<typeof schema.products>;

// quote types
export type Company = InferSelectModel<typeof schema.companies>;
export type NewCompany = InferInsertModel<typeof schema.companies>;

// taks types
export type Task = InferSelectModel<typeof schema.tasks>;
export type NewTask = InferInsertModel<typeof schema.tasks>;
// permission types
export type Permission = InferSelectModel<typeof schema.permissions>;
export type NewPermission = InferInsertModel<typeof schema.permissions>;

// lead qualification types
export type LeadQualificationCriteria = InferSelectModel<
  typeof schema.leadQualificationCriteria
>;
export type NewLeadQualificationCriteria = InferInsertModel<
  typeof schema.leadQualificationCriteria
>;

// lead tags
export type Tag = InferSelectModel<typeof schema.tags>;
export type NewTag = InferInsertModel<typeof schema.tags>;

// payment term
export type PaymentTerm = InferSelectModel<typeof schema.paymentTerms>;
export type NewPaymentTerm = InferInsertModel<typeof schema.paymentTerms>;
