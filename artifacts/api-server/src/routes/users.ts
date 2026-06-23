import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) { res.status(404).json({ error: "User not found" }); return; }
  res.json(formatUser(user[0]));
});

router.patch("/me", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { name, phone, nationality, avatar } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData["name"] = name;
  if (phone !== undefined) updateData["phone"] = phone;
  if (nationality !== undefined) updateData["nationality"] = nationality;
  if (avatar !== undefined) updateData["avatar"] = avatar;

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning();
  res.json(formatUser(updated!));
});

router.get("/", requireAdmin, async (req, res) => {
  const { limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = parseInt(limit, 10) || 50;
  const off = parseInt(offset, 10) || 0;

  const users = await db.select().from(usersTable).limit(lim).offset(off);
  res.json(users.map(formatUser));
});

router.patch("/:id/role", requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const { role } = req.body;
  const [updated] = await db
    .update(usersTable)
    .set({ role })
    .where(eq(usersTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(formatUser(updated));
});

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    phone: u.phone,
    nationality: u.nationality,
    createdAt: u.createdAt.toISOString(),
  };
}

export default router;
