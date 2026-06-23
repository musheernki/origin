import { Router, type IRouter } from "express";
import healthRouter from "./health";
import destinationsRouter from "./destinations";
import bookingsRouter from "./bookings";
import wishlistRouter from "./wishlist";
import reviewsRouter from "./reviews";
import usersRouter from "./users";
import notificationsRouter from "./notifications";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import { jitProvisionUser } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.use(jitProvisionUser);

router.use(healthRouter);
router.use("/destinations", destinationsRouter);
router.use("/bookings", bookingsRouter);
router.use("/wishlist", wishlistRouter);
router.use("/reviews", reviewsRouter);
router.use("/users", usersRouter);
router.use("/notifications", notificationsRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
