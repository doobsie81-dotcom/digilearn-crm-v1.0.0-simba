import z from "zod";

export const settingsSchema = z.object({
  company_name: z
    .string()
    .min(1, "Site name is required")
    .max(100, "Site name too long"),
  logo: z.any().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  country: z.string().min(1, "Country is required"),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
