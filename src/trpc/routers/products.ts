import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, like, or, and, desc, isNotNull } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "../init";
import { db } from "~/db";
import { products } from "~/db/schema";
import { addProductSchema } from "~/validation/products";
//import { NewProduct } from "~/db/types";

export const productsRouter = createTRPCRouter({
  create: protectedProcedure
    .meta({ openapi: { method: "POST", path: "/products" } })
    .input(
      addProductSchema
    )
    .mutation(async ({ input }) => {
      const [product] = await db.insert(products).values(input);

      return { id: product.insertId };
    }),

  update: protectedProcedure
    .meta({ openapi: { method: "PATCH", path: "/products/{id}" } })
    .input(
      z.object({
        id: z.string().min(1),
        productType: z.enum(["product", "service"]).optional(),
        name: z.string().min(1).optional(),
        price: z.string().or(z.number()).transform(String).optional(),
        discount: z.string().or(z.number()).transform(String).optional(),
        tax: z.string().or(z.number()).transform(String).optional(),
        unit: z
          .enum(["piece", "kilogram", "gram", "use", "litre", "hour", "metre"])
          .optional(),
        description: z.string().optional(),
        sku: z.string().optional(),
        category: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const existing = await db.query.products.findFirst({
        where: eq(products.id, id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await db.update(products).set(updateData).where(eq(products.id, id));

      return { success: true };
    }),

  getById: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/products/{id}" } })
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const product = await db.query.products.findFirst({
        where: eq(products.id, input.id),
        // with: {
        //   documentItems: {
        //     limit: 10,
        //     orderBy: (items, { desc }) => [desc(items.createdAt)],
        //   },
        // },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  list: protectedProcedure
    .meta({ openapi: { method: "GET", path: "/products" } })
    .input(
      z
        .object({
          search: z.string().optional(),
          productType: z.enum(["product", "service"]).optional(),
          isActive: z.boolean().optional(),
          category: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [];

      if (input?.search) {
        conditions.push(
          or(
            like(products.name, `%${input.search}%`),
            //like(products.sku, `%${input.search}%`)
          )
        );
      }

      if (input?.productType) {
        conditions.push(eq(products.productType, input.productType));
      }

      if (input?.isActive !== undefined) {
        conditions.push(eq(products.isActive, input.isActive));
      }

      if (input?.category) {
        //conditions.push(eq(products.category, input.category));
      }

      const items = await db.query.products.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        limit: input?.limit ?? 50,
        offset: input?.offset ?? 0,
        orderBy: [desc(products.createdAt)],
      });

      return items;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const existing = await db.query.products.findFirst({
        where: eq(products.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      // Soft delete
      await db
        .update(products)
        .set({ isActive: false })
        .where(eq(products.id, input.id));

      return { success: true };
    }),

  // Get active products for dropdowns
  listForSelect: protectedProcedure
    .input(
      z
        .object({
          productType: z.enum(["product", "service"]).optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const conditions = [eq(products.isActive, true)];

      if (input?.productType) {
        conditions.push(eq(products.productType, input.productType));
      }

      return await db.query.products.findMany({
        where: and(...conditions),
        columns: {
          id: true,
          name: true,
          price: true,
          unit: true,
          productType: true,
        },
        orderBy: [products.name],
      });
    }),

  // Get product categories for filtering
  getCategories: protectedProcedure.query(async () => {
    const result = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(and(eq(products.isActive, true), isNotNull(products.category)));

    return result.map((r) => r.category).filter(Boolean);
  }),
});
