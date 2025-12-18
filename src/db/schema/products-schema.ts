import {
  boolean,
  decimal,
  index,
  mysqlEnum,
  mysqlTable,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
/**
 * id - uuid
 * Product name
 * Product Type
 * Price
 * Discount
 * Tax
 * category
 * optional ~ product image
 * **/
export const productTypeEnum = ["product", "service"] as const;
export const metricUnitEnum = [
  "piece",
  "kilogram",
  "gram",
  "use",
  "litre",
  "hour",
  "metre",
] as const;

export const products = mysqlTable(
  "products",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuidv4()),
    productType: mysqlEnum(productTypeEnum).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    category: varchar("category", { length: 255 }),
    price: decimal("price", { precision: 10, scale: 2 }).default("0").notNull(),
    discount: decimal("discount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    tax: decimal("tax", { precision: 10, scale: 2 }).default("0").notNull(),
    unit: mysqlEnum(metricUnitEnum).notNull(),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => [index("name_idx").on(table.name)]
);
