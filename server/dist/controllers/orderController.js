"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.getAllOrders = exports.getMyOrders = exports.handleStripeWebhook = exports.createCheckoutSession = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const stripe_1 = __importDefault(require("stripe"));
const Order_1 = __importDefault(require("../models/Order"));
const Cart_1 = __importDefault(require("../models/Cart"));
const Product_1 = __importDefault(require("../models/Product"));
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured.");
    }
    return new stripe_1.default(secretKey);
};
const createCheckoutSession = async (req, res) => {
    try {
        const stripe = getStripe();
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const { address, phone } = req.body;
        if (!address || !phone) {
            res.status(400).json({
                success: false,
                message: "Delivery address and phone are required.",
            });
            return;
        }
        const cart = await Cart_1.default.findOne({
            user: userId,
        }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            res.status(400).json({
                success: false,
                message: "Your cart is empty.",
            });
            return;
        }
        const lineItems = [];
        for (const item of cart.items) {
            const product = item.product;
            if (!product || !product.isAvailable) {
                res.status(400).json({
                    success: false,
                    message: "One or more products are no longer available.",
                });
                return;
            }
            if (product.stock < item.quantity) {
                res.status(400).json({
                    success: false,
                    message: `Not enough stock for ${product.name}. Available: ${product.stock}.`,
                });
                return;
            }
            lineItems.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        description: product.description,
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.quantity,
            });
        }
        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: lineItems,
            success_url: `${clientUrl}/orders?payment=success`,
            cancel_url: `${clientUrl}/checkout?payment=cancelled`,
            metadata: {
                userId,
                address: String(address).trim(),
                phone: String(phone).trim(),
            },
        });
        res.status(200).json({
            success: true,
            message: "Checkout session created successfully.",
            data: {
                url: session.url,
            },
        });
    }
    catch (error) {
        console.error("Create checkout session error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create checkout session.",
        });
    }
};
exports.createCheckoutSession = createCheckoutSession;
const handleStripeWebhook = async (req, res) => {
    const signature = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripe();
    console.log("Webhook received:", {
        hasSignature: Boolean(signature),
        hasWebhookSecret: Boolean(webhookSecret),
        bodyIsBuffer: Buffer.isBuffer(req.body),
    });
    if (!signature || !webhookSecret) {
        res.status(400).send("Webhook configuration is missing.");
        return;
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    }
    catch (error) {
        console.error("Stripe webhook signature error:", error);
        res.status(400).send("Invalid webhook signature.");
        return;
    }
    try {
        if (event.type === "checkout.session.completed") {
            const session = event.data
                .object;
            if (session.payment_status !== "paid") {
                res.status(200).json({
                    received: true,
                });
                return;
            }
            const userId = session.metadata?.userId;
            const address = session.metadata?.address;
            const phone = session.metadata?.phone;
            if (!userId || !address || !phone) {
                console.error("Stripe session is missing required metadata.");
                res.status(400).json({
                    success: false,
                    message: "Required checkout metadata is missing.",
                });
                return;
            }
            if (!mongoose_1.default.Types.ObjectId.isValid(userId)) {
                res.status(400).json({
                    success: false,
                    message: "Invalid user ID.",
                });
                return;
            }
            const existingOrder = await Order_1.default.findOne({
                stripeSessionId: session.id,
            });
            if (existingOrder) {
                res.status(200).json({
                    received: true,
                });
                return;
            }
            const cart = await Cart_1.default.findOne({
                user: userId,
            });
            if (!cart || cart.items.length === 0) {
                console.error("Cart is empty when Stripe payment completed.");
                res.status(200).json({
                    received: true,
                });
                return;
            }
            const mongoSession = await mongoose_1.default.startSession();
            try {
                await mongoSession.withTransaction(async () => {
                    const currentCart = await Cart_1.default.findOne({
                        user: userId,
                    }).session(mongoSession);
                    if (!currentCart ||
                        currentCart.items.length === 0) {
                        return;
                    }
                    const orderProducts = [];
                    let totalPrice = 0;
                    for (const item of currentCart.items) {
                        const product = await Product_1.default.findById(item.product).session(mongoSession);
                        if (!product || !product.isAvailable) {
                            throw new Error(`PRODUCT_UNAVAILABLE:${String(item.product)}`);
                        }
                        if (product.stock < item.quantity) {
                            throw new Error(`INSUFFICIENT_STOCK:${product.name}:${product.stock}`);
                        }
                        orderProducts.push({
                            product: product._id,
                            name: product.name,
                            quantity: item.quantity,
                            price: product.price,
                        });
                        totalPrice +=
                            product.price * item.quantity;
                        product.stock -= item.quantity;
                        if (product.stock === 0) {
                            product.isAvailable = false;
                        }
                        await product.save({
                            session: mongoSession,
                        });
                    }
                    await Order_1.default.create([
                        {
                            user: userId,
                            products: orderProducts,
                            totalPrice,
                            address,
                            phone,
                            status: "Pending",
                            paymentStatus: "Paid",
                            stripeSessionId: session.id,
                        },
                    ], {
                        session: mongoSession,
                    });
                    currentCart.items = [];
                    await currentCart.save({
                        session: mongoSession,
                    });
                });
            }
            finally {
                await mongoSession.endSession();
            }
        }
        res.status(200).json({
            received: true,
        });
    }
    catch (error) {
        console.error("Stripe webhook error:", error);
        res.status(500).json({
            success: false,
            message: "Webhook processing failed.",
        });
    }
};
exports.handleStripeWebhook = handleStripeWebhook;
const getMyOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const orders = await Order_1.default.find({
            user: userId,
        })
            .populate("products.product", "name image")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "Orders retrieved successfully.",
            data: orders,
        });
    }
    catch (error) {
        console.error("Get my orders error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve orders.",
        });
    }
};
exports.getMyOrders = getMyOrders;
const getAllOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const restaurant = await Restaurant_1.default.findOne({
            user: userId,
        });
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found.",
            });
            return;
        }
        const restaurantProducts = await Product_1.default.find({
            restaurant: restaurant._id,
        }).select("_id");
        const productIds = restaurantProducts.map((product) => product._id);
        const orders = await Order_1.default.find({
            "products.product": {
                $in: productIds,
            },
        })
            .populate("user", "name email")
            .populate("products.product", "name image")
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            message: "Restaurant orders retrieved successfully.",
            data: orders,
        });
    }
    catch (error) {
        console.error("Get restaurant orders error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve restaurant orders.",
        });
    }
};
exports.getAllOrders = getAllOrders;
const updateOrderStatus = async (req, res) => {
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
        const { status } = req.body;
        const validStatuses = [
            "Pending",
            "Confirmed",
            "Preparing",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
        ];
        if (!mongoose_1.default.Types.ObjectId.isValid(String(id))) {
            res.status(400).json({
                success: false,
                message: "Invalid order ID.",
            });
            return;
        }
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                message: "Invalid order status.",
            });
            return;
        }
        const restaurant = await Restaurant_1.default.findOne({
            user: userId,
        });
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found.",
            });
            return;
        }
        const restaurantProducts = await Product_1.default.find({
            restaurant: restaurant._id,
        }).select("_id");
        const productIds = restaurantProducts.map((product) => product._id);
        const order = await Order_1.default.findOne({
            _id: id,
            "products.product": {
                $in: productIds,
            },
        });
        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found for your restaurant.",
            });
            return;
        }
        order.status = status;
        await order.save();
        res.status(200).json({
            success: true,
            message: "Order status updated successfully.",
            data: order,
        });
    }
    catch (error) {
        console.error("Update order status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update order status.",
        });
    }
};
exports.updateOrderStatus = updateOrderStatus;
//# sourceMappingURL=orderController.js.map