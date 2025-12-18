import z from "zod";
import { PROVINCES, REGIONS } from "~/data/provinces";
import { leadSourceEnum } from "~/db/schema";

export const addCompanySchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  province: z.enum(PROVINCES),
  region: z.enum(REGIONS),
  country: z.string().optional(),
  industry: z.string().optional(),
  description: z.string().optional(),
  employeeCount: z.number().min(0).optional(),
  annualRevenue: z.string().optional(),
});

// Validation schema
export const csvCompanyRecordSchema = z.object({
  firstname: z.string().trim().min(1, "First name required"),
  lastname: z.string().trim().min(1, "Last name required"),
  email: z.email("Invalid email"),
  phone: z.string().trim().optional(),
  company: z.string().trim().min(1, "Company required"),
  requirement: z
    .string()
    .trim()
    .min(1, "Lead title or Requirement is required."),
  province: z.enum(PROVINCES),
  region: z.enum(REGIONS),
  source: z.enum(leadSourceEnum),
  comment: z.string().optional(),
  city: z.string().optional(),
});

export type CsvCompanyRecordValues = z.infer<typeof csvCompanyRecordSchema>;
