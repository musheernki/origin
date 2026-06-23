import { Router } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable,
  destinationsTable,
  usersTable,
  reviewsTable,
} from "@workspace/db";
import { eq, sql, desc, gte } from "drizzle-orm";
import { requireAdmin } from "../middlewares/requireAuth";

const router = Router();

router.get("/stats", requireAdmin, async (_req, res) => {
  const [
    bookingStats,
    totalDestinations,
    totalUsers,
    avgRating,
    bookingsByStatus,
    recentBookings,
    topDestinations,
  ] = await Promise.all([
    db.select({
      totalBookings: sql<number>`count(*)::int`,
      activeBookings: sql<number>`count(*) filter (where ${bookingsTable.status} in ('pending','confirmed'))::int`,
      totalRevenue: sql<number>`coalesce(sum(case when ${bookingsTable.paymentStatus} = 'paid' then ${bookingsTable.totalAmount} else 0 end), 0)::float`,
      monthlyRevenue: sql<number>`coalesce(sum(case when ${bookingsTable.paymentStatus} = 'paid' and ${bookingsTable.createdAt} >= now() - interval '30 days' then ${bookingsTable.totalAmount} else 0 end), 0)::float`,
    }).from(bookingsTable),
    db.select({ count: sql<number>`count(*)::int` }).from(destinationsTable).where(eq(destinationsTable.isActive, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ avg: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)::float` }).from(reviewsTable),
    db.select({
      status: bookingsTable.status,
      count: sql<number>`count(*)::int`,
    }).from(bookingsTable).groupBy(bookingsTable.status),
    db.select({
      booking: bookingsTable,
      destination: destinationsTable,
      user: usersTable,
    })
      .from(bookingsTable)
      .innerJoin(destinationsTable, eq(bookingsTable.destinationId, destinationsTable.id))
      .innerJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(10),
    db.select({
      id: destinationsTable.id,
      name: destinationsTable.name,
      country: destinationsTable.country,
      bookingCount: sql<number>`count(${bookingsTable.id})::int`,
      revenue: sql<number>`coalesce(sum(case when ${bookingsTable.paymentStatus} = 'paid' then ${bookingsTable.totalAmount} else 0 end), 0)::float`,
      rating: destinationsTable.rating,
    })
      .from(destinationsTable)
      .leftJoin(bookingsTable, eq(destinationsTable.id, bookingsTable.destinationId))
      .groupBy(destinationsTable.id)
      .orderBy(desc(sql`count(${bookingsTable.id})`))
      .limit(5),
  ]);

  const stats = bookingStats[0]!;
  const byStatus = Object.fromEntries(bookingsByStatus.map((b) => [b.status, b.count]));

  res.json({
    totalBookings: stats.totalBookings,
    activeBookings: stats.activeBookings,
    totalRevenue: stats.totalRevenue,
    monthlyRevenue: stats.monthlyRevenue,
    totalDestinations: totalDestinations[0]?.count ?? 0,
    totalUsers: totalUsers[0]?.count ?? 0,
    avgRating: avgRating[0]?.avg ?? 0,
    bookingsByStatus: byStatus,
    recentBookings: recentBookings.map(({ booking, destination, user }) => ({
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
    topDestinations: topDestinations.map((d) => ({
      id: d.id,
      name: d.name,
      country: d.country,
      bookingCount: d.bookingCount,
      revenue: d.revenue,
      rating: Number(d.rating),
    })),
  });
});

router.get("/revenue", requireAdmin, async (req, res) => {
  const { period = "month" } = req.query as Record<string, string>;
  let truncate: string;
  let interval: string;
  switch (period) {
    case "week": truncate = "day"; interval = "7 days"; break;
    case "year": truncate = "month"; interval = "1 year"; break;
    default: truncate = "week"; interval = "3 months"; break;
  }

  const data = await db.execute(sql`
    SELECT
      date_trunc(${truncate}, ${bookingsTable.createdAt}) as period,
      coalesce(sum(case when ${bookingsTable.paymentStatus} = 'paid' then ${bookingsTable.totalAmount} else 0 end), 0)::float as revenue,
      count(*)::int as bookings
    FROM ${bookingsTable}
    WHERE ${bookingsTable.createdAt} >= now() - interval ${interval}
    GROUP BY 1
    ORDER BY 1
  `);

  res.json(
    (data.rows as Array<{ period: Date; revenue: number; bookings: number }>).map((row) => ({
      period: new Date(row.period).toISOString().split("T")[0],
      revenue: row.revenue,
      bookings: row.bookings,
    })),
  );
});

export default router;
