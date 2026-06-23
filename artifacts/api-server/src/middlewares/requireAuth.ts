import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: "user" | "admin";
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  req.userRole = user[0]?.role ?? "user";

  next();
};

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.userId = userId;

  const user = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user[0] || user[0].role !== "admin") {
    res.status(403).json({ error: "Forbidden: Admin access required" });
    return;
  }
  req.userRole = "admin";
  next();
};

export const jitProvisionUser = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    next();
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!existing[0]) {
    const sessionClaims = auth?.sessionClaims as Record<string, unknown> | undefined;
    const name =
      (sessionClaims?.["name"] as string) ||
      (sessionClaims?.["email"] as string) ||
      "User";
    const email = (sessionClaims?.["email"] as string) || "";
    const avatar = (sessionClaims?.["picture"] as string) || null;

    await db.insert(usersTable).values({
      id: userId,
      name,
      email,
      avatar,
      role: "user",
    }).onConflictDoNothing();
  }

  next();
};
