"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategory = exports.createCategory = exports.getCategories = void 0;
const Category_1 = __importDefault(require("../models/Category"));
const getCategories = async (_req, res) => {
    try {
        const categories = await Category_1.default.find({
            isActive: true,
        }).sort({ name: 1 });
        res.status(200).json({
            success: true,
            message: "Categories retrieved successfully.",
            data: categories,
        });
    }
    catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve categories.",
        });
    }
};
exports.getCategories = getCategories;
const createCategory = async (req, res) => {
    try {
        const { name, description, image } = req.body;
        if (!name) {
            res.status(400).json({
                success: false,
                message: "Category name is required.",
            });
            return;
        }
        const existingCategory = await Category_1.default.findOne({
            name: String(name).trim(),
        });
        if (existingCategory) {
            res.status(409).json({
                success: false,
                message: "Category already exists.",
            });
            return;
        }
        const category = await Category_1.default.create({
            name: String(name).trim(),
            description: description ? String(description).trim() : "",
            image: image ? String(image) : "",
        });
        res.status(201).json({
            success: true,
            message: "Category created successfully.",
            data: category,
        });
    }
    catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create category.",
        });
    }
};
exports.createCategory = createCategory;
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category_1.default.findById(id);
        if (!category) {
            res.status(404).json({
                success: false,
                message: "Category not found.",
            });
            return;
        }
        category.isActive = false;
        await category.save();
        res.status(200).json({
            success: true,
            message: "Category removed successfully.",
        });
    }
    catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove category.",
        });
    }
};
exports.deleteCategory = deleteCategory;
//# sourceMappingURL=categoryController.js.map