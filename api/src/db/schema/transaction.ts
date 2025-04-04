import { pgTable, varchar, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { timestamps } from "./helper";
import { user } from "./user";

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "success",
  "failed",
]);

export const transactionType = pgEnum("transaction_type", ["send", "receive"]);

export const transaction = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id)
    .notNull(),
  type: transactionType("type").notNull(),
  txHash: varchar("tx_hash", { length: 255 }).notNull(),
  status: transactionStatus("status").notNull(),
  amount: integer("amount").notNull(),
  ...timestamps,
});
