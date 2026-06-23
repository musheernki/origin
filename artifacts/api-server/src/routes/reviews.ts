import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable, usersTable, destinationsTable, notificationsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", async (req, res) => {
  const { destinationId, limit = "20", offset = "0" } = req.query as Record<string, string>;
  if (!destinationId) { res.status(400).json({ error: "destinationId required" }); return; }

  const destId = parseInt(destinationId, 10);
  const lim = parseInt(limit, 10) || 20;
  const off = parseInt(offset, 10) || 0;

  const reviews = await db
    .select({
      review: reviewsTable,
      user: usersTable,
    })
    .from(reviewsTable)
    .innerJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
    .where(eq(reviewsTable.destinationId, destId))
    .orderBy(desc(reviewsTable.createdAt))
    .limit(lim)
    .offset(off);

  res.json(
    reviews.map(({ review, user }) => ({
      id: review.id,
      userId: review.userId,
      userName: user.name,
      userAvatar: user.avatar,
      destinationId: review.destinationId,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
    })),
  );
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { destinationId, rating, comment } = req.body;

  const [review] = await db.insert(reviewsTable).values({
    userId,
    destinationId,
    rating: Math.min(5, Math.max(1, parseInt(String(rating), 10))),
    comment,
  }).returning();

  const stats = await db
    .select({
      avg: sql<string>`avg(${reviewsTable.rating})`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviewsTable)
    .where(eq(reviewsTable.destinationId, destinationId));

  await db
    .update(destinationsTable)
    .set({
      rating: stats[0]?.avg ?? "0",
      reviewCount: stats[0]?.count ?? 0,
    })
    .where(eq(destinationsTable.id, destinationId));

  await db.insert(notificationsTable).values({
    userId,
    title: "Review Posted",
    message: `Your review has been posted successfully.`,
    type: "review_posted",
    relatedId: review!.id,
  });

  const userRows = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);

  res.status(201).json({
    id: review!.id,
    userId: review!.userId,
    userName: userRows[0]?.name ?? "",
    userAvatar: userRows[0]?.avatar ?? null,
    destinationId: review!.destinationId,
    rating: review!.rating,
    comment: review!.comment,
    createdAt: review!.createdAt.toISOString(),
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
  res.status(204).send();
});

export default router;
