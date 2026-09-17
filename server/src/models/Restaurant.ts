import mongoose, { Document, Schema } from "mongoose";

export interface IRestaurant extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  description: string;
  city: string;
  address: string;
  cuisines: string[];
  imageUrl: string;
  deliveryPrice: number;
  estimatedDeliveryTime: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    cuisines: {
      type: [String],
      required: true,
      default: [],
    },

    imageUrl: {
      type: String,
      default: "",
    },

    deliveryPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    estimatedDeliveryTime: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRestaurant>(
  "Restaurant",
  restaurantSchema
);
