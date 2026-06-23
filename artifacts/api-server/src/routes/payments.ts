import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { bookingsTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

function getStripe() {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-05-27.dahlia" });
}

router.post("/create-intent", requireAuth, async (req, res) => {
  const { bookingId, amount } = req.body;
  const userId = req.userId!;

  const stripe = getStripe();
  if (!stripe) {
    res.json({ clientSecret: "mock_secret_" + bookingId, paymentIntentId: "mock_pi_" + bookingId });
    return;
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    metadata: { bookingId: String(bookingId), userId },
  });

  res.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

router.post("/confirm", requireAuth, async (req, res) => {
  const { bookingId, paymentIntentId } = req.body;
  const userId = req.userId!;

  const [updated] = await db
    .update(bookingsTable)
    .set({
      status: "confirmed",
      paymentStatus: "paid",
      paymentIntentId,
    })
    .where(eq(bookingsTable.id, bookingId))
    .returning();

  if (!updated) { res.status(404).json({ error: "Booking not found" }); return; }

  await db.insert(notificationsTable).values({
    userId,
    title: "Payment Successful",
    message: `Payment confirmed for booking #${bookingId}. Your trip is booked!`,
    type: "payment_success",
    relatedId: bookingId,
  });

  await db.insert(notificationsTable).values({
    userId,
    title: "Booking Confirmed",
    message: `Your booking #${bookingId} is now confirmed. Enjoy your trip!`,
    type: "booking_confirmed",
    relatedId: bookingId,
  });

  res.json({
    ...updated,
    totalAmount: Number(updated.totalAmount),
    destinationName: "",
    destinationImage: "",
    createdAt: updated.createdAt.toISOString(),
  });
});

export default router;
