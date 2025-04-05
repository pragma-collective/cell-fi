import { pgTable, varchar, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

import { nomination } from './nomination';
import { timestamps } from "./helper";

export const user = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 255 }).notNull(),
  ensName: varchar("ens_name", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 255 }),
  lastName: varchar("last_name", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 255 }),
  walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  circleWalletId: uuid("circle_wallet_id").notNull(),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  ...timestamps,
});

export const userRelations = relations(user, ({ many }) => ({
    approvers: many(nomination),
}));