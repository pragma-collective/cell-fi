
import { pgTable, uuid, pgEnum, varchar } from "drizzle-orm/pg-core";
import { timestamps } from "./helper";
import { user } from "./user";
import { transaction } from "./transaction";

export const approvalStatus = pgEnum("approval_status", ["pending", "rejected", "accepted"]);

export const approval = pgTable('approvals', {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .references(() => transaction.id)
    .notNull(),
  approverId:
    uuid("approver_id")
      .references(() => user.id)
      .notNull(),
  code: varchar("code", { length: 60 }).notNull(),
  status: approvalStatus("status").default("pending"),
  ...timestamps,
});