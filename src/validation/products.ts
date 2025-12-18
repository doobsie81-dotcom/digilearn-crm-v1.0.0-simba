import z from "zod";
import { metricUnitEnum, productTypeEnum } from "~/db/schema";

export const addProductSchema = z.object({
  productType: z.enum(productTypeEnum),
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  discount: z.string().optional(),
  tax: z.string().optional(),
  unit: z.enum(metricUnitEnum),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean(),
});
