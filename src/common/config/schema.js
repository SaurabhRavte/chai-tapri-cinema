import {
  pgTable,
  serial,
  varchar,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("customer"),
  refreshToken: varchar("refresh_token", { length: 512 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const seats = pgTable("seats", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }),
  isbooked: integer("isbooked").default(0),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
