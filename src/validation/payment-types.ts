import z from "zod";

export const paymentTermSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    type: z.enum([
      "cash",
      "3-term",
      "4-term",
      "6-term",
      "9-term",
      "custom-date",
      "net-30",
      "net-60",
      "net-90",
      "custom",
    ]),
    interestRate: z.number().min(0).max(100),
    numberOfTerms: z.number().int().min(1).optional(),
    termLengthDays: z.number().int().min(1).optional(),
    daysUntilDue: z.number().int().min(0).optional(),
    termsAndConditions: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean(),
    isDefault: z.boolean(),
    displayOrder: z.number().int(),
  })
  .refine(
    (data) => {
      // Name is required for custom plans
      if (data.type === "custom") {
        return !!data.name && data.name.length >= 2;
      }
      return true;
    },
    {
      message: "Name is required for custom plans",
      path: ["name"],
    }
  );

export type PaymentTermFormValues = z.infer<typeof paymentTermSchema>;
