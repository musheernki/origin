import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(
    notifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      relatedId: n.relatedId,
      createdAt: n.createdAt.toISOString(),
    })),
  );
});

router.patch("/read-all", requireAuth, async (req, res) => {
  const userId = req.userId!;
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, userId));
  res.json({ success: true, message: "All notifications marked as read" });
});

router.patch("/:id/read", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  const userId = req.userId!;
  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();
  if (!updated || updated.userId !== userId) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    id: updated.id,
    userId: updated.userId,
    title: updated.title,
    message: updated.message,
    type: updated.type,
    isRead: updated.isRead,
    relatedId: updated.relatedId,
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
