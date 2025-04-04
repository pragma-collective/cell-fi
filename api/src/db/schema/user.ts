import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "./helper";

export const user = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull(),
  ensName: varchar("ens_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 255 }),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  ...timestamps,
});
