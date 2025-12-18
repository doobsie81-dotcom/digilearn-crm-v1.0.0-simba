import z from "zod";
import { EMAIL_PRIORITIES } from "../data/email-types";

const emailRecipientSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const emailAttachmentSchema = z.object({
  name: z.string(),
  contentType: z.string(),
  contentBytes: z.string(), // Base64 encoded
});

export const sendEmailSchema = z.object({
  from: z.string().email().optional(),
  to: z
    .array(emailRecipientSchema)
    .min(1, "At least one recipient is required"),
  cc: z.array(emailRecipientSchema).optional(),
  bcc: z.array(emailRecipientSchema).optional(),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  isHtml: z.boolean(),
  importance: z.enum(EMAIL_PRIORITIES),
  attachments: z.array(emailAttachmentSchema).optional(),
  leadId: z.string().optional(),
  dealId: z.string().optional(),
});

export const composeEmailSchema = z.object({
  leadId: z.string(),
  dealId: z.string().optional(),
  subject: z.string(),
  body: z.string(),
  recipients: z.array(z.string()),
});

export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ComposeEmailFormValues = z.infer<typeof composeEmailSchema>;
