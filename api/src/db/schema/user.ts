import { integer, pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./helper";

export const user = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull(),
  ensName: varchar("ens_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
  ...timestamps,
});
