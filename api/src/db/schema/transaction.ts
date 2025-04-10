import { pgTable, varchar, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { timestamps } from "./helper";
import { user } from "./user";

export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "success",
  "failed",
]);

export const transactionType = pgEnum("transaction_type", [
  "send",
  "receive",
  "pay_request",
]);

export const transaction = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id)
    .notNull(),
  type: transactionType("type").notNull(),
  destinationAddress: varchar("destination_address", { length: 255 }).notNull(),
  txHash: varchar("tx_hash", { length: 255 }).notNull(),
  status: transactionStatus("status").notNull(),
  amount: integer("amount").notNull(),
  ...timestamps,
});

export const transactionRelations = relations(transaction, ({ one }) => ({
  owner: one(user, {
    fields: [transaction.userId],
    references: [user.id],
  }),
}));
