import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const destinationsTable = pgTable("destinations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  description: text("description").notNull(),
  longDescription: text("long_description").notNull().default(""),
  category: text("category").notNull(),
  pricePerPerson: numeric("price_per_person", {
    precision: 10,
    scale: 2,
  }).notNull(),
  images: jsonb("images").$type<string[]>().notNull().default([]),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("0"),
  reviewCount: integer("review_count").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  duration: text("duration").notNull().default(""),
  maxGuests: integer("max_guests").notNull().default(10),
  highlights: jsonb("highlights").$type<string[]>().notNull().default([]),
  inclusions: jsonb("inclusions").$type<string[]>().notNull().default([]),
  exclusions: jsonb("exclusions").$type<string[]>().notNull().default([]),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDestinationSchema = createInsertSchema(
  destinationsTable,
).omit({ createdAt: true, updatedAt: true });
export type InsertDestination = z.infer<typeof insertDestinationSchema>;
export type Destination = typeof destinationsTable.$inferSelect;
