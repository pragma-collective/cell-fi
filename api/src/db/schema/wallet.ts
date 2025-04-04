import { pgTable, varchar, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./user";
import { timestamps } from "./helper";

export const wallet = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  address: varchar("address", { length: 255 }).notNull(),
  userId: uuid("user_id").references(() => user.id),
  walletName: varchar("wallet_name", { length: 255 }).notNull(),
  ...timestamps,
});
