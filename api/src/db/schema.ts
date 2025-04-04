import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// This is just an example table - modify according to your needs
export const examples = pgTable('examples', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});