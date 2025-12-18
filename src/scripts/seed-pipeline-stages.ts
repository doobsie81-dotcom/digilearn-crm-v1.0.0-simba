// db/seed.ts
import { db } from "~/db"; // Your Drizzle DB instance
import { PipelineStageSchema } from "~/db/schema";

const DEAL_STAGES = [
  {
    status: "lead_qualification" as const,
    name: "Lead Qualification",
    order: 1,
    color: "bg-blue-500",
    description: "Validate school fit and budget capacity",
    slaHours: 24,
    slaDays: 1,
    requiresAction: true,
    actionDescription: "Lead must be contacted same day or next working day",
    escalationTarget: "sales_manager",
    escalationMessage:
      "Lead not contacted within 24 hours. Auto-reminder sent to rep.",
    autoReminderEnabled: true,
    reminderIntervalHours: 12,
    requiredFields: ["lastContactedAt"],
    preventProgressWithout: "Initial contact must be logged",
    autoReassignOnViolation: false,
    stageProbability: 10, // Added
  },
  {
    status: "stakeholder_discovery" as const,
    name: "Stakeholder Discovery",
    order: 2,
    color: "bg-indigo-500",
    description: "Map decision influencers and champions",
    slaDays: 5,
    requiresAction: true,
    actionDescription: "Meeting date must be set within 5 business days",
    escalationTarget: "regional_rep",
    escalationMessage:
      "Meeting not scheduled within 5 days. Sales manager and regional rep notified.",
    autoReminderEnabled: true,
    reminderIntervalHours: 24,
    requiredFields: ["meetingScheduledAt"],
    preventProgressWithout: "Meeting must be scheduled",
    autoReassignOnViolation: false,
    stageProbability: 25, // Added
  },
  {
    status: "needs_assessment" as const,
    name: "Needs Assessment",
    order: 3,
    color: "bg-purple-500",
    description: "Understand requirements and demonstrate value",
    slaDays: 10,
    requiresAction: true,
    actionDescription:
      "Demo must be conducted within 10 working days of meeting",
    escalationTarget: "sales_manager",
    escalationMessage:
      "Demo not completed within 10 days. Reminder sent to client and manager.",
    autoReminderEnabled: true,
    reminderIntervalHours: 48,
    requiredFields: ["demoCompletedAt", "needsAssessmentCompletedAt"],
    preventProgressWithout: "Demo and needs assessment must be completed",
    autoReassignOnViolation: true,
    stageProbability: 40, // Added
  },
  {
    status: "solution_proposal" as const,
    name: "Solution Proposal",
    order: 4,
    color: "bg-pink-500",
    description: "Create tailored solution and commercial proposal",
    slaHours: 72,
    slaDays: 3,
    requiresAction: true,
    actionDescription:
      "Client must receive and acknowledge proposal within 72 hours",
    escalationTarget: "sales_rep",
    escalationMessage:
      "Proposal not acknowledged within 3 days. Auto-reminder sent to client.",
    autoReminderEnabled: true,
    reminderIntervalHours: 24,
    requiredFields: ["proposalSentAt", "proposalAcknowledgedAt"],
    preventProgressWithout: "Proposal must be sent and acknowledged",
    autoReassignOnViolation: false,
    stageProbability: 60, // Added
  },
  {
    status: "procurement_process" as const,
    name: "Procurement Process",
    order: 5,
    color: "bg-orange-500",
    description: "Navigate procurement requirements",
    slaDays: 14,
    requiresAction: true,
    actionDescription: "Must resolve objections within 2 weeks",
    escalationTarget: "sales_director",
    escalationMessage:
      "Negotiation exceeding 14 days. Escalated to sales director.",
    autoReminderEnabled: true,
    reminderIntervalHours: 72,
    requiredFields: [],
    preventProgressWithout: null,
    autoReassignOnViolation: false,
    stageProbability: 75, // Added
  },
  {
    status: "contract_finalization" as const,
    name: "Contract Finalization",
    order: 6,
    color: "bg-amber-500",
    description: "Finalize legal and commercial terms",
    slaDays: 21,
    requiresAction: true,
    actionDescription: "Client should reach decision in 3 weeks",
    escalationTarget: "sales_manager",
    escalationMessage:
      "Decision pending beyond 21 days. Auto-created re-engage task.",
    autoReminderEnabled: true,
    reminderIntervalHours: 120,
    requiredFields: [],
    preventProgressWithout: null,
    autoReassignOnViolation: false,
    stageProbability: 90, // Added
  },
  {
    status: "implementation_delivery" as const,
    name: "Implementation & Delivery",
    order: 7,
    color: "bg-lime-500",
    description: "Execute solution deployment and training",
    slaDays: 30,
    requiresAction: false,
    actionDescription: "Implementation kickoff and delivery",
    escalationTarget: null,
    escalationMessage: null,
    autoReminderEnabled: false,
    reminderIntervalHours: null,
    requiredFields: [],
    preventProgressWithout: null,
    autoReassignOnViolation: false,
    stageProbability: 95, 
  },
  {
    status: "closed_won" as const,
    name: "Closed Won",
    order: 8,
    color: "bg-green-500",
    description: "Customer success and expansion opportunities",
    slaHours: 48,
    slaDays: 2,
    requiresAction: true,
    actionDescription:
      "Implementation kickoff task created within 2 business days of payment",
    escalationTarget: "operations_manager",
    escalationMessage:
      "Handover not completed within 48 hours. Operations manager notified.",
    autoReminderEnabled: true,
    reminderIntervalHours: 24,
    requiredFields: ["actualCloseDate"],
    preventProgressWithout: "Payment confirmation required",
    autoReassignOnViolation: false,
    stageProbability: 100, 
  },
  {
    status: "closed_lost" as const,
    name: "Closed Lost",
    order: 9,
    color: "bg-red-500",
    description: "Capture loss reasons and maintain relationships",
    slaHours: 24,
    requiresAction: true,
    actionDescription: "Lost reason must be documented within a day",
    escalationTarget: "sales_manager",
    escalationMessage: "Lost reason not documented. Deal cannot be archived.",
    autoReminderEnabled: true,
    reminderIntervalHours: 12,
    requiredFields: ["lostReason", "actualCloseDate"],
    preventProgressWithout: "Loss reason must be documented before archiving",
    autoReassignOnViolation: false,
    stageProbability: 0, 
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // 1. Seed Pipeline Stages
    console.log("📊 Seeding pipeline stages...");
    const stageResults = await db
      .insert(PipelineStageSchema)
      .values(DEAL_STAGES)
      .$returningId();
    console.log(`✅ Created ${stageResults.length} pipeline stages`);

    console.log("🎉 Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seed()
  .then(() => {
    console.log("✨ Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error during seeding:", error);
    process.exit(1);
  });
