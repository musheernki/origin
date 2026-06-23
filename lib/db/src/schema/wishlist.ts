import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { destinationsTable } from "./destinations";

export const wishlistTable = pgTable("wishlist", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id),
  destinationId: integer("destination_id")
    .notNull()
    .references(() => destinationsTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlistTable).omit({
  createdAt: true,
});
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type Wishlist = typeof wishlistTable.$inferSelect;
