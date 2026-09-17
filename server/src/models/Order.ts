import mongoose, { Document, Schema, Types } from "mongoose";

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed";

export interface IOrderProduct {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  user: Types.ObjectId;
  products: IOrderProduct[];
  totalPrice: number;
  address: string;
  phone: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string;
}

const orderProductSchema = new Schema<IOrderProduct>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    products: {
      type: [orderProductSchema],
      required: true,
      validate: {
        validator: (products: IOrderProduct[]) =>
          products.length > 0,
        message: "Order must contain at least one product.",
      },
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Pending",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
    },

    stripeSessionId: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IOrder>("Order", orderSchema);