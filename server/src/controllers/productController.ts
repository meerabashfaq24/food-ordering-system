import { Request, Response } from "express";
import mongoose from "mongoose";
import Product from "../models/Product";
import Category from "../models/Category";
import Restaurant from "../models/Restaurant";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ApiResponse } from "../types";

export const getProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category, search, restaurant } = req.query;

    const filter: Record<string, unknown> = {
      isAvailable: true,
    };

    if (restaurant) {
      if (!mongoose.Types.ObjectId.isValid(String(restaurant))) {
        res.status(400).json({
          success: false,
          message: "Invalid restaurant ID.",
        } satisfies ApiResponse<never>);
        return;
      }

      filter.restaurant = String(restaurant);
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(String(category))) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        } satisfies ApiResponse<never>);
        return;
      }

      filter.category = String(category);
    }

    if (search) {
      filter.name = {
        $regex: String(search),
        $options: "i",
      };
    }

    const products = await Product.find(filter)
      .populate("category", "name")
      .populate("restaurant", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      data: products,
    } satisfies ApiResponse<typeof products>);
  } catch (error) {
    console.error("Get products error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve products.",
    } satisfies ApiResponse<never>);
  }
};

export const getProductById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    const product = await Product.findById(id)
      .populate("category", "name")
      .populate("restaurant", "name");

    if (!product || !product.isAvailable) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    res.status(200).json({
      success: true,
      message: "Product retrieved successfully.",
      data: product,
    } satisfies ApiResponse<typeof product>);
  } catch (error) {
    console.error("Get product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve product.",
    } satisfies ApiResponse<never>);
  }
};

export const createProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const {
      name,
      description,
      price,
      image,
      restaurant,
      category,
      stock,
    } = req.body;

    if (
      !name ||
      !description ||
      price === undefined ||
      !restaurant ||
      !category ||
      stock === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name, description, price, restaurant, category and stock are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(String(restaurant))) {
      res.status(400).json({
        success: false,
        message: "Invalid restaurant ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(String(category))) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurantOwnedByUser = await Restaurant.findOne({
      _id: restaurant,
      user: userId,
    });

    if (!restaurantOwnedByUser) {
      res.status(403).json({
        success: false,
        message: "You can only manage your own restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    const categoryExists = await Category.findById(category);

    if (!categoryExists || !categoryExists.isActive) {
      res.status(404).json({
        success: false,
        message: "Category not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (Number(price) < 0 || Number(stock) < 0) {
      res.status(400).json({
        success: false,
        message: "Price and stock cannot be negative.",
      } satisfies ApiResponse<never>);
      return;
    }

    const product = await Product.create({
      name: String(name).trim(),
      description: String(description).trim(),
      price: Number(price),
      image: image ? String(image) : "",
      restaurant,
      category,
      stock: Number(stock),
      isAvailable: true,
    });

    const populatedProduct = await product.populate([
      {
        path: "category",
        select: "name",
      },
      {
        path: "restaurant",
        select: "name",
      },
    ]);

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: populatedProduct,
    } satisfies ApiResponse<typeof populatedProduct>);
  } catch (error) {
    console.error("Create product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create product.",
    } satisfies ApiResponse<never>);
  }
};

export const updateProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (!product.restaurant) {
      res.status(403).json({
        success: false,
        message: "Product is not linked to a restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurantOwnedByUser = await Restaurant.findOne({
      _id: product.restaurant,
      user: userId,
    });

    if (!restaurantOwnedByUser) {
      res.status(403).json({
        success: false,
        message: "You can only manage your own restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    const {
      name,
      description,
      price,
      image,
      restaurant,
      category,
      stock,
      isAvailable,
    } = req.body;

    if (name !== undefined) {
      product.name = String(name).trim();
    }

    if (description !== undefined) {
      product.description = String(description).trim();
    }

    if (price !== undefined) {
      if (Number(price) < 0) {
        res.status(400).json({
          success: false,
          message: "Price cannot be negative.",
        } satisfies ApiResponse<never>);
        return;
      }

      product.price = Number(price);
    }

    if (image !== undefined) {
      product.image = String(image);
    }

    if (restaurant !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(String(restaurant))) {
        res.status(400).json({
          success: false,
          message: "Invalid restaurant ID.",
        } satisfies ApiResponse<never>);
        return;
      }

      const newRestaurantOwnedByUser = await Restaurant.findOne({
        _id: restaurant,
        user: userId,
      });

      if (!newRestaurantOwnedByUser) {
        res.status(403).json({
          success: false,
          message: "You can only use your own restaurant.",
        } satisfies ApiResponse<never>);
        return;
      }

      product.restaurant = restaurant;
    }

    if (category !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(String(category))) {
        res.status(400).json({
          success: false,
          message: "Invalid category ID.",
        } satisfies ApiResponse<never>);
        return;
      }

      const categoryExists = await Category.findById(category);

      if (!categoryExists || !categoryExists.isActive) {
        res.status(404).json({
          success: false,
          message: "Category not found.",
        } satisfies ApiResponse<never>);
        return;
      }

      product.category = category;
    }

    if (stock !== undefined) {
      if (Number(stock) < 0) {
        res.status(400).json({
          success: false,
          message: "Stock cannot be negative.",
        } satisfies ApiResponse<never>);
        return;
      }

      product.stock = Number(stock);
    }

    if (isAvailable !== undefined) {
      product.isAvailable = Boolean(isAvailable);
    }

    await product.save();

    const populatedProduct = await product.populate([
      {
        path: "category",
        select: "name",
      },
      {
        path: "restaurant",
        select: "name",
      },
    ]);

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: populatedProduct,
    } satisfies ApiResponse<typeof populatedProduct>);
  } catch (error) {
    console.error("Update product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update product.",
    } satisfies ApiResponse<never>);
  }
};

export const deleteProduct = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({
        success: false,
        message: "Product not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (!product.restaurant) {
      res.status(403).json({
        success: false,
        message: "Product is not linked to a restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurantOwnedByUser = await Restaurant.findOne({
      _id: product.restaurant,
      user: userId,
    });

    if (!restaurantOwnedByUser) {
      res.status(403).json({
        success: false,
        message: "You can only manage your own restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    product.isAvailable = false;

    await product.save();

    res.status(200).json({
      success: true,
      message: "Product removed successfully.",
    } satisfies ApiResponse<never>);
  } catch (error) {
    console.error("Delete product error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove product.",
    } satisfies ApiResponse<never>);
  }
};