import { Request, Response } from "express";
import Category from "../models/Category";
import { ApiResponse } from "../types";
import Restaurant from "../models/Restaurant";
export const getCategories = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await Category.find({
      isActive: true,
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      message: "Categories retrieved successfully.",
      data: categories,
    } satisfies ApiResponse<typeof categories>);
  } catch (error) {
    console.error("Get categories error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve categories.",
    } satisfies ApiResponse<never>);
  }
};

export const createCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, image } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: "Category name is required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const existingCategory = await Category.findOne({
      name: String(name).trim(),
    });

    if (existingCategory) {
      res.status(409).json({
        success: false,
        message: "Category already exists.",
      } satisfies ApiResponse<never>);
      return;
    }

    const category = await Category.create({
      name: String(name).trim(),
      description: description ? String(description).trim() : "",
      image: image ? String(image) : "",
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    } satisfies ApiResponse<typeof category>);
  } catch (error) {
    console.error("Create category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create category.",
    } satisfies ApiResponse<never>);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      res.status(404).json({
        success: false,
        message: "Category not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    category.isActive = false;
    await category.save();

    res.status(200).json({
      success: true,
      message: "Category removed successfully.",
    } satisfies ApiResponse<never>);
  } catch (error) {
    console.error("Delete category error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to remove category.",
    } satisfies ApiResponse<never>);
  }
};
