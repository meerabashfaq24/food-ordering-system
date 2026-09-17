"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/create-checkout-session", authMiddleware_1.protect, orderController_1.createCheckoutSession);
router.post("/webhook", orderController_1.handleStripeWebhook);
router.get("/my-orders", authMiddleware_1.protect, orderController_1.getMyOrders);
router.get("/", authMiddleware_1.protect, orderController_1.getAllOrders);
router.put("/:id/status", authMiddleware_1.protect, orderController_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map