import * as z from "zod";
import { quoteItemSchema } from "./accounting";

export const adddeals = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  value: z.number().min(0, "Value must be a positive number"),
  currency: z.string(),
  leadId: z.string().min(1, "Please select a lead"),
  currentStageId: z.string().min(1, "Please select a stage"),
  probability: z.number().min(0).max(100),
  expectedCloseDate: z.date(),
  assignedTo: z.string(),
  // Competitor fields
  competitors: z
    .array(
      z.object({
        competitorName: z.string().min(1, "Competitor name is required"),
        competitorStrength: z.number().min(0).max(100),
        status: z.enum(["active", "eliminated", "unknown"]),
        ourAdvantage: z.string().optional(),
        theirAdvantage: z.string().optional(),
      })
    )
    .optional(),
  // Deal items
  items: z.array(quoteItemSchema).optional(),
  // Stakeholders
  stakeholders: z
    .array(z.string().min(1, "Stakeholder ID is required"))
    .optional(),
});

export const updateStageSchema = z.object({
  id: z.string(),
  status: z.string(),
});

export const updateStageBulkSchema = z.object({
  id: z.string(),
  status: z.string(),
  position: z.number().int().positive().min(1000).max(1_000_000),
});

export const dealsBulkUpdate = z.object({
  deals: z.array(updateStageBulkSchema),
});

export type AddDealValues = z.infer<typeof adddeals>;
