import { Request, Response } from "express";
import mongoose from "mongoose";
import Stripe from "stripe";

import Order, {
  OrderStatus,
} from "../models/Order";
import Cart from "../models/Cart";
import Product from "../models/Product";
import Restaurant from "../models/Restaurant";

import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ApiResponse } from "../types";

const getStripe = (): Stripe => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }

  return new Stripe(secretKey);
};

export const createCheckoutSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const stripe = getStripe();
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const { address, phone } = req.body;

    if (!address || !phone) {
      res.status(400).json({
        success: false,
        message: "Delivery address and phone are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const cart = await Cart.findOne({
      user: userId,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      } satisfies ApiResponse<never>);
      return;
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const item of cart.items) {
      const product = item.product as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        description: string;
        price: number;
        stock: number;
        isAvailable: boolean;
        image?: string;
      };

      if (!product || !product.isAvailable) {
        res.status(400).json({
          success: false,
          message: "One or more products are no longer available.",
        } satisfies ApiResponse<never>);
        return;
      }

      if (product.stock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Not enough stock for ${product.name}. Available: ${product.stock}.`,
        } satisfies ApiResponse<never>);
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

    const clientUrl =
      process.env.CLIENT_URL || "http://localhost:5173";

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
    } satisfies ApiResponse<{ url: string | null }>);
  } catch (error) {
    console.error("Create checkout session error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create checkout session.",
    } satisfies ApiResponse<never>);
  }
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
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

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook signature error:", error);

    res.status(400).send("Invalid webhook signature.");
    return;
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data
        .object as Stripe.Checkout.Session;

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
        console.error(
          "Stripe session is missing required metadata."
        );

        res.status(400).json({
          success: false,
          message: "Required checkout metadata is missing.",
        });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({
          success: false,
          message: "Invalid user ID.",
        });
        return;
      }

      const existingOrder = await Order.findOne({
        stripeSessionId: session.id,
      });

      if (existingOrder) {
        res.status(200).json({
          received: true,
        });
        return;
      }

      const cart = await Cart.findOne({
        user: userId,
      });

      if (!cart || cart.items.length === 0) {
        console.error(
          "Cart is empty when Stripe payment completed."
        );

        res.status(200).json({
          received: true,
        });
        return;
      }

      const mongoSession = await mongoose.startSession();

      try {
        await mongoSession.withTransaction(async () => {
          const currentCart = await Cart.findOne({
            user: userId,
          }).session(mongoSession);

          if (
            !currentCart ||
            currentCart.items.length === 0
          ) {
            return;
          }

          const orderProducts: {
            product: mongoose.Types.ObjectId;
            name: string;
            quantity: number;
            price: number;
          }[] = [];

          let totalPrice = 0;

          for (const item of currentCart.items) {
            const product = await Product.findById(
              item.product
            ).session(mongoSession);

            if (!product || !product.isAvailable) {
              throw new Error(
                `PRODUCT_UNAVAILABLE:${String(item.product)}`
              );
            }

            if (product.stock < item.quantity) {
              throw new Error(
                `INSUFFICIENT_STOCK:${product.name}:${product.stock}`
              );
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

          await Order.create(
            [
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
            ],
            {
              session: mongoSession,
            }
          );

          currentCart.items = [];

          await currentCart.save({
            session: mongoSession,
          });
        });
      } finally {
        await mongoSession.endSession();
      }
    }

    res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
};

export const getMyOrders = async (
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

    const orders = await Order.find({
      user: userId,
    })
      .populate("products.product", "name image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: orders,
    } satisfies ApiResponse<typeof orders>);
  } catch (error) {
    console.error("Get my orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders.",
    } satisfies ApiResponse<never>);
  }
};

export const getAllOrders = async (
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

    const restaurant = await Restaurant.findOne({
      user: userId,
    });

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurantProducts = await Product.find({
      restaurant: restaurant._id,
    }).select("_id");

    const productIds = restaurantProducts.map(
      (product) => product._id
    );

    const orders = await Order.find({
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
    } satisfies ApiResponse<typeof orders>);
  } catch (error) {
    console.error("Get restaurant orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve restaurant orders.",
    } satisfies ApiResponse<never>);
  }
};

export const updateOrderStatus = async (
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
    const { status } = req.body;

    const validStatuses: OrderStatus[] = [
      "Pending",
      "Confirmed",
      "Preparing",
      "Out for Delivery",
      "Delivered",
      "Cancelled",
    ];

    if (!mongoose.Types.ObjectId.isValid(String(id))) {
      res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (!validStatuses.includes(status as OrderStatus)) {
      res.status(400).json({
        success: false,
        message: "Invalid order status.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurant = await Restaurant.findOne({
      user: userId,
    });

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurantProducts = await Product.find({
      restaurant: restaurant._id,
    }).select("_id");

    const productIds = restaurantProducts.map(
      (product) => product._id
    );

    const order = await Order.findOne({
      _id: id,
      "products.product": {
        $in: productIds,
      },
    });

    if (!order) {
      res.status(404).json({
        success: false,
        message: "Order not found for your restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    order.status = status as OrderStatus;

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: order,
    } satisfies ApiResponse<typeof order>);
  } catch (error) {
    console.error("Update order status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order status.",
    } satisfies ApiResponse<never>);
  }
};