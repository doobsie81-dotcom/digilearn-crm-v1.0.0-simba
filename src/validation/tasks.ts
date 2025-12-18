import z from "zod";
import { taskStatusEnum, taskReferenceTypeEnum } from "~/db/schema";

export const taskStatusSchema = z.enum(taskStatusEnum);
export const referenceTypeSchema = z.enum(taskReferenceTypeEnum);

export const addTaskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  status: taskStatusSchema,
  leadId: z.string(),
  dealId: z.string().optional(),
  assignedTo: z.string().optional(),
  dueDate: z.date()
});

export const tasksBulkUpdate = z.object({
        tasks: z.array(
          z.object({
            id: z.string(),
            status: taskStatusSchema,
            position: z.number().int().positive().min(1000).max(1_000_000)
          })
        )
      })

export type TaskFormValues = z.infer<typeof addTaskSchema>;
