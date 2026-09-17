import { Router } from "express";
import {
  register,
  login,
  createAdmin,
  getProfile,
  updateProfile,
} from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/create-admin", createAdmin);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;