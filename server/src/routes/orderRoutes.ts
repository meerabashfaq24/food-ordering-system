import { Router } from "express";

import {
  createCheckoutSession,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  handleStripeWebhook,
} from "../controllers/orderController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/create-checkout-session",
  protect,
  createCheckoutSession
);

router.post(
  "/webhook",
  handleStripeWebhook
);

router.get(
  "/my-orders",
  protect,
  getMyOrders
);

router.get(
  "/",
  protect,
  getAllOrders
);

router.put(
  "/:id/status",
  protect,
  updateOrderStatus
);

export default router;