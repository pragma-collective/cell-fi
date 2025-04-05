import { pgTable, uuid, pgEnum, varchar } from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { timestamps } from "./helper";
import { user } from "./user";

export const nominationStatus = pgEnum("nomination_status", ["pending", "rejected", "accepted"]);

export const nomination = pgTable("nominations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id)
    .notNull(),
  nomineeId:
    uuid("nominee_id")
      .references(() => user.id)
      .notNull(),
  status: nominationStatus("status").default("pending"),
  code: varchar("code", { length: 60 }).notNull(),
  ...timestamps,
});

export const nominationRelations = relations(nomination, ({ one }) => ({
  nominee: one(user, {
    fields: [nomination.userId],
    references: [user.id],
  }),
}));