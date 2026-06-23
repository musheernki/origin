import { Router } from "express";
import { db } from "@workspace/db";
import {
  destinationsTable,
  bookingsTable,
  wishlistTable,
} from "@workspace/db";
import { eq, and, ilike, gte, lte, sql, desc, asc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = Router();

router.get("/featured", async (req, res) => {
  const featured = await db
    .select()
    .from(destinationsTable)
    .where(and(eq(destinationsTable.featured, true), eq(destinationsTable.isActive, true)))
    .limit(8);
  res.json(featured.map(formatDestination));
});

router.get("/categories", async (_req, res) => {
  const cats = await db
    .select({
      category: destinationsTable.category,
      count: sql<number>`count(*)::int`,
      avgPrice: sql<number>`avg(${destinationsTable.pricePerPerson})::float`,
    })
    .from(destinationsTable)
    .where(eq(destinationsTable.isActive, true))
    .groupBy(destinationsTable.category);
  res.json(cats);
});

router.get("/popular-countries", async (_req, res) => {
  const countries = await db
    .select({
      country: destinationsTable.country,
      count: sql<number>`count(*)::int`,
      coverImage: sql<string>`(array_agg(${destinationsTable.images}))[1]`,
    })
    .from(destinationsTable)
    .where(eq(destinationsTable.isActive, true))
    .groupBy(destinationsTable.country)
    .orderBy(desc(sql`count(*)`))
    .limit(6);

  res.json(
    countries.map((c) => ({
      country: c.country,
      count: c.count,
      coverImage: Array.isArray(c.coverImage)
        ? (c.coverImage as string[])[0] ?? ""
        : String(c.coverImage ?? ""),
    })),
  );
});

router.get("/", async (req, res) => {
  const { search, category, country, minPrice, maxPrice, minRating, sortBy, limit = "20", offset = "0" } =
    req.query as Record<string, string>;

  const conditions = [eq(destinationsTable.isActive, true)];

  if (search) {
    conditions.push(
      sql`(${destinationsTable.name} ilike ${"%" + search + "%"} or ${destinationsTable.country} ilike ${"%" + search + "%"} or ${destinationsTable.city} ilike ${"%" + search + "%"})`,
    );
  }
  if (category) conditions.push(eq(destinationsTable.category, category));
  if (country) conditions.push(ilike(destinationsTable.country, `%${country}%`));
  if (minPrice) conditions.push(gte(destinationsTable.pricePerPerson, minPrice));
  if (maxPrice) conditions.push(lte(destinationsTable.pricePerPerson, maxPrice));
  if (minRating) conditions.push(gte(destinationsTable.rating, minRating));

  let orderBy;
  switch (sortBy) {
    case "price_asc": orderBy = asc(destinationsTable.pricePerPerson); break;
    case "price_desc": orderBy = desc(destinationsTable.pricePerPerson); break;
    case "rating_desc": orderBy = desc(destinationsTable.rating); break;
    case "popular": orderBy = desc(destinationsTable.reviewCount); break;
    default: orderBy = desc(destinationsTable.createdAt);
  }

  const lim = Math.min(parseInt(limit, 10) || 20, 100);
  const off = parseInt(offset, 10) || 0;

  const [destinations, countResult] = await Promise.all([
    db
      .select()
      .from(destinationsTable)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(lim)
      .offset(off),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(destinationsTable)
      .where(and(...conditions)),
  ]);

  const total = countResult[0]?.count ?? 0;
  res.json({
    destinations: destinations.map(formatDestination),
    total,
    hasMore: off + lim < total,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const dest = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.id, id))
    .limit(1);

  if (!dest[0]) { res.status(404).json({ error: "Not found" }); return; }

  let isWishlisted = false;
  const userId = req.userId;
  if (userId) {
    const wl = await db
      .select()
      .from(wishlistTable)
      .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.destinationId, id)))
      .limit(1);
    isWishlisted = !!wl[0];
  }

  res.json({ ...formatDestination(dest[0]), isWishlisted });
});

router.post("/", requireAdmin, async (req, res) => {
  const d = req.body;
  const [created] = await db.insert(destinationsTable).values({
    name: d.name,
    country: d.country,
    city: d.city,
    description: d.description,
    longDescription: d.longDescription ?? "",
    category: d.category,
    pricePerPerson: String(d.pricePerPerson),
    images: d.images ?? [],
    featured: d.featured ?? false,
    tags: d.tags ?? [],
    duration: d.duration ?? "",
    maxGuests: d.maxGuests ?? 10,
    highlights: d.highlights ?? [],
    inclusions: d.inclusions ?? [],
    exclusions: d.exclusions ?? [],
    latitude: d.latitude != null ? String(d.latitude) : null,
    longitude: d.longitude != null ? String(d.longitude) : null,
  }).returning();
  res.status(201).json(formatDestination(created!));
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  const d = req.body;
  const updateData: Record<string, unknown> = {};
  if (d.name !== undefined) updateData["name"] = d.name;
  if (d.country !== undefined) updateData["country"] = d.country;
  if (d.city !== undefined) updateData["city"] = d.city;
  if (d.description !== undefined) updateData["description"] = d.description;
  if (d.longDescription !== undefined) updateData["longDescription"] = d.longDescription;
  if (d.category !== undefined) updateData["category"] = d.category;
  if (d.pricePerPerson !== undefined) updateData["pricePerPerson"] = String(d.pricePerPerson);
  if (d.images !== undefined) updateData["images"] = d.images;
  if (d.featured !== undefined) updateData["featured"] = d.featured;
  if (d.tags !== undefined) updateData["tags"] = d.tags;
  if (d.duration !== undefined) updateData["duration"] = d.duration;
  if (d.maxGuests !== undefined) updateData["maxGuests"] = d.maxGuests;
  if (d.highlights !== undefined) updateData["highlights"] = d.highlights;
  if (d.inclusions !== undefined) updateData["inclusions"] = d.inclusions;
  if (d.exclusions !== undefined) updateData["exclusions"] = d.exclusions;
  if (d.isActive !== undefined) updateData["isActive"] = d.isActive;
  if (d.latitude !== undefined) updateData["latitude"] = d.latitude != null ? String(d.latitude) : null;
  if (d.longitude !== undefined) updateData["longitude"] = d.longitude != null ? String(d.longitude) : null;

  const [updated] = await db
    .update(destinationsTable)
    .set(updateData)
    .where(eq(destinationsTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatDestination(updated));
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  await db.delete(destinationsTable).where(eq(destinationsTable.id, id));
  res.status(204).send();
});

function formatDestination(d: typeof destinationsTable.$inferSelect) {
  return {
    ...d,
    pricePerPerson: Number(d.pricePerPerson),
    rating: Number(d.rating),
    latitude: d.latitude != null ? Number(d.latitude) : null,
    longitude: d.longitude != null ? Number(d.longitude) : null,
    createdAt: d.createdAt.toISOString(),
  };
}

export default router;
