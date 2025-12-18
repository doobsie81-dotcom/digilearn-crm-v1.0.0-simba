import z from "zod";

export const createNoteSchema = z.object({
  leadId: z.string(),
  dealId: z.string().optional(),
  note: z.string().min(1, "Note is required"),
  tags: z.string().optional(),
});

export type CreateNoteValues = z.infer<typeof createNoteSchema>;
