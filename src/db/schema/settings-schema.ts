import { mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { v4 as uuidv4 } from "uuid";

export const SettingSchema = mysqlTable("settings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => uuidv4()),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: varchar("value", { length: 255 }).notNull(),
});
