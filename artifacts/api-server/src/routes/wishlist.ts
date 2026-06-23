import { Router } from "express";
import { db } from "@workspace/db";
import { wishlistTable, destinationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const items = await db
    .select({
      wishlist: wishlistTable,
      destination: destinationsTable,
    })
    .from(wishlistTable)
    .innerJoin(destinationsTable, eq(wishlistTable.destinationId, destinationsTable.id))
    .where(eq(wishlistTable.userId, userId));

  res.json(
    items.map(({ wishlist, destination }) => ({
      id: wishlist.id,
      userId: wishlist.userId,
      destinationId: wishlist.destinationId,
      destination: {
        ...destination,
        pricePerPerson: Number(destination.pricePerPerson),
        rating: Number(destination.rating),
        latitude: destination.latitude != null ? Number(destination.latitude) : null,
        longitude: destination.longitude != null ? Number(destination.longitude) : null,
        createdAt: destination.createdAt.toISOString(),
      },
      createdAt: wishlist.createdAt.toISOString(),
    })),
  );
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { destinationId } = req.body;

  const existing = await db
    .select()
    .from(wishlistTable)
    .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.destinationId, destinationId)))
    .limit(1);

  if (existing[0]) {
    const dest = await db
      .select()
      .from(destinationsTable)
      .where(eq(destinationsTable.id, destinationId))
      .limit(1);
    res.status(201).json({
      id: existing[0].id,
      userId: existing[0].userId,
      destinationId: existing[0].destinationId,
      destination: { ...dest[0]!, pricePerPerson: Number(dest[0]!.pricePerPerson), rating: Number(dest[0]!.rating), latitude: dest[0]!.latitude != null ? Number(dest[0]!.latitude) : null, longitude: dest[0]!.longitude != null ? Number(dest[0]!.longitude) : null, createdAt: dest[0]!.createdAt.toISOString() },
      createdAt: existing[0].createdAt.toISOString(),
    });
    return;
  }

  const [item] = await db.insert(wishlistTable).values({ userId, destinationId }).returning();

  const dest = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.id, destinationId))
    .limit(1);

  res.status(201).json({
    id: item!.id,
    userId: item!.userId,
    destinationId: item!.destinationId,
    destination: { ...dest[0]!, pricePerPerson: Number(dest[0]!.pricePerPerson), rating: Number(dest[0]!.rating), latitude: dest[0]!.latitude != null ? Number(dest[0]!.latitude) : null, longitude: dest[0]!.longitude != null ? Number(dest[0]!.longitude) : null, createdAt: dest[0]!.createdAt.toISOString() },
    createdAt: item!.createdAt.toISOString(),
  });
});

router.delete("/:destinationId", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const destinationId = parseInt(String(req.params["destinationId"]), 10);
  await db
    .delete(wishlistTable)
    .where(and(eq(wishlistTable.userId, userId), eq(wishlistTable.destinationId, destinationId)));
  res.status(204).send();
});

export default router;
