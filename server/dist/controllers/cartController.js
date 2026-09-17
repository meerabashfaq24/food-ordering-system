"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const getCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        let cart = await Cart_1.default.findOne({
            user: userId,
        }).populate("items.product");
        if (!cart) {
            cart = await Cart_1.default.create({
                user: userId,
                items: [],
            });
        }
        res.status(200).json({
            success: true,
            message: "Cart retrieved successfully.",
            data: cart,
        });
    }
    catch (error) {
        console.error("Get cart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve cart.",
        });
    }
};
exports.getCart = getCart;
const addToCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId, quantity } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        if (!productId || !mongoose_1.default.Types.ObjectId.isValid(productId)) {
            res.status(400).json({
                success: false,
                message: "Valid product ID is required.",
            });
            return;
        }
        const requestedQuantity = quantity === undefined
            ? 1
            : Number(quantity);
        if (!Number.isInteger(requestedQuantity) ||
            requestedQuantity < 1) {
            res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number.",
            });
            return;
        }
        const product = await Product_1.default.findById(productId);
        if (!product || !product.isAvailable) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (product.stock < requestedQuantity) {
            res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) available.`,
            });
            return;
        }
        let cart = await Cart_1.default.findOne({
            user: userId,
        });
        if (!cart) {
            cart = await Cart_1.default.create({
                user: userId,
                items: [],
            });
        }
        const existingItem = cart.items.find((item) => item.product.toString() === String(productId));
        if (existingItem) {
            const newQuantity = existingItem.quantity + requestedQuantity;
            if (newQuantity > product.stock) {
                res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} item(s) available.`,
                });
                return;
            }
            existingItem.quantity = newQuantity;
        }
        else {
            cart.items.push({
                product: product._id,
                quantity: requestedQuantity,
            });
        }
        await cart.save();
        const populatedCart = await cart.populate("items.product");
        res.status(200).json({
            success: true,
            message: "Product added to cart.",
            data: populatedCart,
        });
    }
    catch (error) {
        console.error("Add to cart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add product to cart.",
        });
    }
};
exports.addToCart = addToCart;
const updateCartItem = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.params;
        const { quantity } = req.body;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(String(productId))) {
            res.status(400).json({
                success: false,
                message: "Invalid product ID.",
            });
            return;
        }
        const newQuantity = Number(quantity);
        if (!Number.isInteger(newQuantity) || newQuantity < 1) {
            res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number.",
            });
            return;
        }
        const product = await Product_1.default.findById(productId);
        if (!product || !product.isAvailable) {
            res.status(404).json({
                success: false,
                message: "Product not found.",
            });
            return;
        }
        if (newQuantity > product.stock) {
            res.status(400).json({
                success: false,
                message: `Only ${product.stock} item(s) available.`,
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
            user: userId,
        });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: "Cart not found.",
            });
            return;
        }
        const item = cart.items.find((cartItem) => cartItem.product.toString() === String(productId));
        if (!item) {
            res.status(404).json({
                success: false,
                message: "Product is not in the cart.",
            });
            return;
        }
        item.quantity = newQuantity;
        await cart.save();
        const populatedCart = await cart.populate("items.product");
        res.status(200).json({
            success: true,
            message: "Cart updated successfully.",
            data: populatedCart,
        });
    }
    catch (error) {
        console.error("Update cart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update cart.",
        });
    }
};
exports.updateCartItem = updateCartItem;
const removeFromCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.params;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
            user: userId,
        });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: "Cart not found.",
            });
            return;
        }
        const originalLength = cart.items.length;
        cart.items = cart.items.filter((item) => item.product.toString() !== String(productId));
        if (cart.items.length === originalLength) {
            res.status(404).json({
                success: false,
                message: "Product is not in the cart.",
            });
            return;
        }
        await cart.save();
        const populatedCart = await cart.populate("items.product");
        res.status(200).json({
            success: true,
            message: "Product removed from cart.",
            data: populatedCart,
        });
    }
    catch (error) {
        console.error("Remove cart item error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to remove product from cart.",
        });
    }
};
exports.removeFromCart = removeFromCart;
const clearCart = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
            user: userId,
        });
        if (!cart) {
            res.status(404).json({
                success: false,
                message: "Cart not found.",
            });
            return;
        }
        cart.items = [];
        await cart.save();
        res.status(200).json({
            success: true,
            message: "Cart cleared successfully.",
            data: cart,
        });
    }
    catch (error) {
        console.error("Clear cart error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to clear cart.",
        });
    }
};
exports.clearCart = clearCart;
//# sourceMappingURL=cartController.js.map