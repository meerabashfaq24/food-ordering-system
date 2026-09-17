import { Router } from "express";

import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";

import { protect } from "../middleware/authMiddleware";

const router = Router();

router.get("/", getProducts);

router.get("/:id", getProductById);

router.post("/", protect, createProduct);

router.put("/:id", protect, updateProduct);

router.delete("/:id", protect, deleteProduct);

export default router;