import z from "zod";
import { CHURCH_DENOMINATIONS } from "~/data/church-denominations";
import { PROVINCES, REGIONS } from "~/data/provinces";
import { contactRoleEnum, leadSourceEnum, OWNERSHIP_TYPES, SCHOOL_TYPES } from "~/db/schema";

// Step 1: Lead Information Schema
export const leadInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  source: z.enum(leadSourceEnum),
  companyId: z.string().max(36).optional(),
  companyName: z.string().min(1).max(255),
  province: z.enum(PROVINCES).optional(),
  ownershipType: z.enum(OWNERSHIP_TYPES).optional(),
  schoolType: z.enum(SCHOOL_TYPES).optional(),
  churchDenomination: z.enum(CHURCH_DENOMINATIONS).optional(),
  district: z.string().optional(),
  region: z.enum(REGIONS).optional(),
  city: z.string().optional(),
  estimatedValue: z.number().optional(),
  assignedTo: z.string().max(36).optional(), // For managers/admins to assign to sales agents
});

// Step 2: Contact Schema
export const contacts = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.email("Invalid email"),
  phoneNumber: z.string().optional(),
  jobTitle: z.string().optional(),
  isPrimary: z.boolean(),
  role: z.enum(contactRoleEnum),
});

export const contactsSchema = z.object({
  contacts: z.array(contacts).min(1, "At least one contact is required"),
});

// Step 3: Event Schema
export const eventSchema = z
  .object({
    title: z.string().min(3, "Title is required").optional(),
    description: z.string().optional(),
    startDate: z.string().optional(),
    startTime: z.string().optional(),
    endDate: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine(
    (data) => {
      const allEmpty = Object.values(data).every((v) => !v);
      if (allEmpty) return true; // skip is allowed
      return (
        data.title &&
        data.startDate &&
        data.startTime &&
        data.endDate &&
        data.endTime
      );
    },
    {
      message:
        "If you start filling this step, all required fields must be provided",
    }
  );

export const createleads = z.object({
  lead: leadInfoSchema,
  contacts: z.array(contacts),
  // event: eventSchema,
});
