"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.protect);
router.get("/", cartController_1.getCart);
router.post("/items", cartController_1.addToCart);
router.put("/items/:productId", cartController_1.updateCartItem);
router.delete("/items/:productId", cartController_1.removeFromCart);
router.delete("/", cartController_1.clearCart);
exports.default = router;
//# sourceMappingURL=cartRoutes.js.map