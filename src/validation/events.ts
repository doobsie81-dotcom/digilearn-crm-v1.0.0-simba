import z from "zod";
import { platformEnum } from "~/db/schema";

export const createMeetingSchema = z.object({
  leadId: z.string(),
  dealId: z.string().optional(),
  contactId: z.string().optional(),
  subject: z.string().min(1).max(255),
  description: z.string().optional(),
  scheduledAt: z.date(),
  startDate: z.string(),
  startTime: z.string(),
  endDate: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  platform: z.enum(platformEnum),
  attendees: z.array(z.string()).optional(),
  agenda: z.string().optional(),
  assignedTo: z.string(),
});

export const updateMeetingSchema = z.object({
  eventId: z.string().min(1, "meeting id is required"),
  subject: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  scheduledAt: z.date().optional(),
  duration: z.number().int().min(1).optional(),
  location: z.string().optional(),
  meetingLink: z.string().optional(),
  platform: z.enum(platformEnum).optional(),
  attendees: z.array(z.string()).optional(),
  agenda: z.string().optional(),
  notes: z.string().optional(),
  recordingUrl: z.string().url().optional(),
});


export type AddMeetingValues = z.infer<typeof createMeetingSchema>;