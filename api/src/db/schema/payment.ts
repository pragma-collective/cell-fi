import { pgTable, varchar, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { timestamps } from "./helper";
import { user } from "./user";

export const paymentStatus = pgEnum("payment_status", ["pending", "paid"]);

export const payment = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").notNull().references(() => user.id),
  recipientId: uuid("recipient_id").notNull().references(() => user.id),
  paymentCode: varchar("payment_code", { length: 6 }).notNull().unique(),
  amount: integer("amount").notNull(),
  status: paymentStatus("status").default("pending"),
  ...timestamps,
});

export const paymentRelations = relations(payment, ({ one }) => ({
  requester: one(user, {
    fields: [payment.requesterId],
    references: [user.id],
  }),
  recipient: one(user, {
    fields: [payment.recipientId],
    references: [user.id],
  }),
}));