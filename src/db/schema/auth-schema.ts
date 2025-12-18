import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  mysqlEnum,
} from "drizzle-orm/mysql-core";
import { v4 as uuid } from "uuid";

export const UserRoles = ["admin", "sales-agent", 'sales-manager', 'manager'] as const;

export const user = mysqlTable(
  "user",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuid()),
    name: text("name").notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text("image"),
    role: mysqlEnum("role", UserRoles)
      .default("sales-agent")
      .notNull(),
    banned: boolean("banned").default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("email_idx").on(table.email)]
);

export const session = mysqlTable(
  "session",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuid()),
    expiresAt: timestamp("expires_at").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    impersonatedBy: varchar("impersonated_by", { length: 36 }),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("user_id_idx").on(table.userId),
    index("token_idx").on(table.token),
    index("expires_at_idx").on(table.expiresAt),
  ]
);

export const account = mysqlTable(
  "account",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuid()),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)]
);

export const verification = mysqlTable(
  "verification",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => uuid()),
    identifier: varchar("identifier", { length: 255 }).notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("identifier_idx").on(table.identifier),
    index("verification_expires_at_idx").on(table.expiresAt),
  ]
);
