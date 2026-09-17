"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const restaurantController_1 = require("../controllers/restaurantController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
/*
  Public discovery
*/
router.get("/", restaurantController_1.getRestaurants);
/*
  Owner management
  These MUST come before /:id.
*/
router.get("/owner/me", authMiddleware_1.protect, restaurantController_1.getMyRestaurant);
router.put("/owner/me", authMiddleware_1.protect, restaurantController_1.updateMyRestaurant);
/*
  Restaurant creation
*/
router.post("/", authMiddleware_1.protect, restaurantController_1.createRestaurant);
/*
  Single restaurant
*/
router.get("/:id", restaurantController_1.getRestaurantById);
exports.default = router;
//# sourceMappingURL=restaurantRoutes.js.map