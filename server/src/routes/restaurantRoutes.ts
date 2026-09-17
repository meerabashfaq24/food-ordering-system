import { Router } from "express";
import {
  createRestaurant,
  getMyRestaurant,
  updateMyRestaurant,
  getRestaurants,
  getRestaurantById,
} from "../controllers/restaurantController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

/*
  Public discovery
*/
router.get("/", getRestaurants);

/*
  Owner management
  These MUST come before /:id.
*/
router.get(
  "/owner/me",
  protect,
  getMyRestaurant
);

router.put(
  "/owner/me",
  protect,
  updateMyRestaurant
);

/*
  Restaurant creation
*/
router.post(
  "/",
  protect,
  createRestaurant
);

/*
  Single restaurant
*/
router.get(
  "/:id",
  getRestaurantById
);

export default router;