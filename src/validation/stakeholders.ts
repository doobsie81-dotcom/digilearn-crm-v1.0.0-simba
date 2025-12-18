import z from "zod";
import { contactFrequencyEnum } from "~/db/schema";

export const addStakeholdersSchema = z.object({
  dealId: z.string(),
  contactId: z.string().min(1, "Contact is required"),
  role: z.string().min(1, "Role is required"),
  influence: z.number().min(0).max(100),
  sentiment: z.enum(["positive", "neutral", "negative", "champion", 'blocker']),
  lastContactedAt: z.date().optional(),
  contactFrequency: z.enum(contactFrequencyEnum).optional(),
  engaged: z.boolean(),
  notes: z.string().optional(),
});
