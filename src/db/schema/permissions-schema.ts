import {
  boolean,
  mysqlEnum,
  mysqlTable,
  text,
  varchar,
} from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";
import { UserRoles } from "./auth-schema";

export const permissionActionsEnum = [
  "create",
  "read",
  "update",
  "delete",
  "manage",
] as const;

export const permissions = mysqlTable("permissions", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  role: mysqlEnum("role", UserRoles).notNull(),
  action: mysqlEnum("action", permissionActionsEnum).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  conditions: text("conditions"),
  inverted: boolean("inverted").default(false),
});
