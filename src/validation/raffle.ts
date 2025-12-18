import { z } from "zod";

export const createRaffleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  location: z.string().max(255).optional(),
  startDate: z.date(),
  endDate: z.date(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateRaffleSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(255).optional(),
  location: z.string().max(255).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const enterRaffleSchema = z.object({
  raffleId: z.string(),
  leadId: z.string(),
});

export const getRaffleSchema = z.object({
  id: z.string(),
});

export const listRafflesSchema = z.object({
  active: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
  offset: z.number().min(0).default(0).optional(),
}).optional();

export type CreateRaffleInput = z.infer<typeof createRaffleSchema>;
export type UpdateRaffleInput = z.infer<typeof updateRaffleSchema>;
export type EnterRaffleInput = z.infer<typeof enterRaffleSchema>;
export type GetRaffleInput = z.infer<typeof getRaffleSchema>;
export type ListRafflesInput = z.infer<typeof listRafflesSchema>;
