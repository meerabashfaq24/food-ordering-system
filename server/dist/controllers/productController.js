"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Product_1 = __importDefault(require("../models/Product"));
const Category_1 = __importDefault(require("../models/Category"));
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const getProducts = async (req, res) => {
    try {
        const { category, search, restaurant } = req.query;
        const filter = {
            isAvailable: true,
        };
        if (restaurant) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(restaurant))) {
                res.status(400).json({
                    success: false,
                    message: "Invalid restaurant ID.",
                });
                return;
            }
            filter.restaurant = String(restaurant);
        }
        if (category) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(category))) {
                res.status(400).json({
                    success: false,
                    message: "Invalid category ID.",
                });
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
        const products = await Product_1.default.find(filter)
            .populate("category", "name")
            .populate("restaurant", "name")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "Products retrieved successfully.",
            data: products,
        });
    }
    catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve products.",
        });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(String(id))) {
            res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
            return;
        }
        const product = await Product_1.default.findById(id)
            .populate("category", "name")
            .populate("restaurant", "name");
        if (!product || !product.isAvailable) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Product retrieved successfully.",
            data: product,
        });
    }
    catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve product.",
        });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const { name, description, price, image, restaurant, category, stock, } = req.body;
        if (!name ||
            !description ||
            price === undefined ||
            !restaurant ||
            !category ||
            stock === undefined) {
            res.status(400).json({
                success: false,
                message: "Name, description, price, restaurant, category and stock are required.",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(String(restaurant))) {
            res.status(400).json({
                success: false,
                message: "Invalid restaurant ID.",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(String(category))) {
            res.status(400).json({
                success: false,
                message: "Invalid category ID.",
            });
            return;
        }
        const restaurantOwnedByUser = await Restaurant_1.default.findOne({
            _id: restaurant,
            user: userId,
        });
        if (!restaurantOwnedByUser) {
            res.status(403).json({
                success: false,
                message: "You can only manage your own restaurant.",
            });
            return;
        }
        const categoryExists = await Category_1.default.findById(category);
        if (!categoryExists || !categoryExists.isActive) {
            res.status(404).json({
                success: false,
                message: "Category not found.",
            });
            return;
        }
        if (Number(price) < 0 || Number(stock) < 0) {
            res.status(400).json({
                success: false,
                message: "Price and stock cannot be negative.",
            });
            return;
        }
        const product = await Product_1.default.create({
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
        });
    }
    catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create product.",
        });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(String(id))) {
            res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
            return;
        }
        const product = await Product_1.default.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (!product.restaurant) {
            res.status(403).json({
                success: false,
                message: "Product is not linked to a restaurant.",
            });
            return;
        }
        const restaurantOwnedByUser = await Restaurant_1.default.findOne({
            _id: product.restaurant,
            user: userId,
        });
        if (!restaurantOwnedByUser) {
            res.status(403).json({
                success: false,
                message: "You can only manage your own restaurant.",
            });
            return;
        }
        const { name, description, price, image, restaurant, category, stock, isAvailable, } = req.body;
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
                });
                return;
            }
            product.price = Number(price);
        }
        if (image !== undefined) {
            product.image = String(image);
        }
        if (restaurant !== undefined) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(restaurant))) {
                res.status(400).json({
                    success: false,
                    message: "Invalid restaurant ID.",
                });
                return;
            }
            const newRestaurantOwnedByUser = await Restaurant_1.default.findOne({
                _id: restaurant,
                user: userId,
            });
            if (!newRestaurantOwnedByUser) {
                res.status(403).json({
                    success: false,
                    message: "You can only use your own restaurant.",
                });
                return;
            }
            product.restaurant = restaurant;
        }
        if (category !== undefined) {
            if (!mongoose_1.default.Types.ObjectId.isValid(String(category))) {
                res.status(400).json({
                    success: false,
                    message: "Invalid category ID.",
                });
                return;
            }
            const categoryExists = await Category_1.default.findById(category);
            if (!categoryExists || !categoryExists.isActive) {
                res.status(404).json({
                    success: false,
                    message: "Category not found.",
                });
                return;
            }
            product.category = category;
        }
        if (stock !== undefined) {
            if (Number(stock) < 0) {
                res.status(400).json({
                    success: false,
                    message: "Stock cannot be negative.",
                });
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
        });
    }
    catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product.",
        });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(String(id))) {
            res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
            return;
        }
        const product = await Product_1.default.findById(id);
        if (!product) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (!product.restaurant) {
            res.status(403).json({
                success: false,
                message: "Product is not linked to a restaurant.",
            });
            return;
        }
        const restaurantOwnedByUser = await Restaurant_1.default.findOne({
            _id: product.restaurant,
            user: userId,
        });
        if (!restaurantOwnedByUser) {
            res.status(403).json({
                success: false,
                message: "You can only manage your own restaurant.",
            });
            return;
        }
        product.isAvailable = false;
        await product.save();
        res.status(200).json({
            success: true,
            message: "Product removed successfully.",
        });
    }
    catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove product.",
        });
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=productController.js.map