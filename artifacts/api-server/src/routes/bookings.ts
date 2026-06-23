import { Router } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable,
  destinationsTable,
  usersTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/requireAuth";

const router = Router();

router.get("/admin", requireAdmin, async (req, res) => {
  const { status, limit = "50", offset = "0" } = req.query as Record<string, string>;
  const lim = parseInt(limit, 10) || 50;
  const off = parseInt(offset, 10) || 0;

  const allBookings = await db
    .select({
      booking: bookingsTable,
      destination: destinationsTable,
      user: usersTable,
    })
    .from(bookingsTable)
    .innerJoin(destinationsTable, eq(bookingsTable.destinationId, destinationsTable.id))
    .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
    .where(status ? eq(bookingsTable.status, status as "pending" | "confirmed" | "cancelled" | "completed") : undefined)
    .orderBy(desc(bookingsTable.createdAt))
    .limit(lim)
    .offset(off);

  res.json(
    allBookings.map(({ booking, destination, user }) => ({
      id: booking.id,
      userId: booking.userId,
      userName: user.name,
      userEmail: user.email,
      destinationId: booking.destinationId,
      destinationName: destination.name,
      destinationImage: (destination.images as string[])[0] ?? "",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt.toISOString(),
    })),
  );
});

router.get("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { status, limit = "20", offset = "0" } = req.query as Record<string, string>;
  const lim = parseInt(limit, 10) || 20;
  const off = parseInt(offset, 10) || 0;

  const conditions = [eq(bookingsTable.userId, userId)];
  if (status) conditions.push(eq(bookingsTable.status, status as "pending" | "confirmed" | "cancelled" | "completed"));

  const bookings = await db
    .select({
      booking: bookingsTable,
      destination: destinationsTable,
    })
    .from(bookingsTable)
    .innerJoin(destinationsTable, eq(bookingsTable.destinationId, destinationsTable.id))
    .where(and(...conditions))
    .orderBy(desc(bookingsTable.createdAt))
    .limit(lim)
    .offset(off);

  res.json(
    bookings.map(({ booking, destination }) => ({
      id: booking.id,
      userId: booking.userId,
      destinationId: booking.destinationId,
      destinationName: destination.name,
      destinationImage: (destination.images as string[])[0] ?? "",
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalAmount: Number(booking.totalAmount),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      paymentIntentId: booking.paymentIntentId,
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt.toISOString(),
    })),
  );
});

router.post("/", requireAuth, async (req, res) => {
  const userId = req.userId!;
  const { destinationId, checkIn, checkOut, guests, specialRequests } = req.body;

  const dest = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.id, destinationId))
    .limit(1);
  if (!dest[0]) { res.status(404).json({ error: "Destination not found" }); return; }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const nights = Math.max(1, Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)));
  const totalAmount = Number(dest[0].pricePerPerson) * guests * nights;

  const [booking] = await db.insert(bookingsTable).values({
    userId,
    destinationId,
    checkIn,
    checkOut,
    guests,
    totalAmount: String(totalAmount),
    status: "pending",
    paymentStatus: "unpaid",
    specialRequests: specialRequests ?? null,
  }).returning();

  await db.insert(notificationsTable).values({
    userId,
    title: "Booking Received",
    message: `Your booking for ${dest[0].name} has been received and is pending confirmation.`,
    type: "general",
    relatedId: booking!.id,
  });

  const destination = dest[0];
  res.status(201).json({
    ...booking!,
    totalAmount: Number(booking!.totalAmount),
    destinationName: destination.name,
    destinationImage: (destination.images as string[])[0] ?? "",
    createdAt: booking!.createdAt.toISOString(),
  });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  const userId = req.userId!;

  const result = await db
    .select({
      booking: bookingsTable,
      destination: destinationsTable,
    })
    .from(bookingsTable)
    .innerJoin(destinationsTable, eq(bookingsTable.destinationId, destinationsTable.id))
    .where(and(eq(bookingsTable.id, id), eq(bookingsTable.userId, userId)))
    .limit(1);

  if (!result[0]) { res.status(404).json({ error: "Not found" }); return; }
  const { booking, destination } = result[0];

  res.json({
    id: booking.id,
    userId: booking.userId,
    destinationId: booking.destinationId,
    destination: {
      ...destination,
      pricePerPerson: Number(destination.pricePerPerson),
      rating: Number(destination.rating),
      latitude: destination.latitude != null ? Number(destination.latitude) : null,
      longitude: destination.longitude != null ? Number(destination.longitude) : null,
      createdAt: destination.createdAt.toISOString(),
    },
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    guests: booking.guests,
    totalAmount: Number(booking.totalAmount),
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentIntentId: booking.paymentIntentId,
    specialRequests: booking.specialRequests,
    createdAt: booking.createdAt.toISOString(),
  });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params["id"]), 10);
  const userId = req.userId!;
  const { status, paymentStatus } = req.body;

  const existing = await db
    .select()
    .from(bookingsTable)
    .where(and(eq(bookingsTable.id, id), eq(bookingsTable.userId, userId)))
    .limit(1);

  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }

  const updateData: Record<string, unknown> = {};
  if (status) updateData["status"] = status;
  if (paymentStatus) updateData["paymentStatus"] = paymentStatus;

  const [updated] = await db
    .update(bookingsTable)
    .set(updateData)
    .where(eq(bookingsTable.id, id))
    .returning();

  if (status === "cancelled") {
    await db.insert(notificationsTable).values({
      userId,
      title: "Booking Cancelled",
      message: `Your booking #${id} has been cancelled.`,
      type: "booking_cancelled",
      relatedId: id,
    });
  }

  const dest = await db
    .select()
    .from(destinationsTable)
    .where(eq(destinationsTable.id, updated!.destinationId))
    .limit(1);

  res.json({
    ...updated!,
    totalAmount: Number(updated!.totalAmount),
    destinationName: dest[0]?.name ?? "",
    destinationImage: (dest[0]?.images as string[] | undefined)?.[0] ?? "",
    createdAt: updated!.createdAt.toISOString(),
  });
});

export default router;
