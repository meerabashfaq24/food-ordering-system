import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/database";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import restaurantRoutes from "./routes/restaurantRoutes";

dotenv.config();

const app = express();

app.use(cors());

app.post(
  "/api/orders/webhook",
  express.raw({ type: "application/json" }),
  async (req, res, next) => {
    try {
      const { handleStripeWebhook } = await import(
        "./controllers/orderController"
      );

      await handleStripeWebhook(req, res);
    } catch (error) {
      next(error);
    }
  }
);

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Food Ordering API is running 🚀",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/restaurants", restaurantRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();