import { pgTable, varchar, uuid, timestamp } from "drizzle-orm/pg-core";
import { timestamps } from "./helper";
import { user } from "./user";

export const otp = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => user.id).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  reference: uuid("reference").defaultRandom().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  ...timestamps,
});