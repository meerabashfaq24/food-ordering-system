export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface Category {
  _id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category:
    | string
    | {
        _id: string;
        name: string;
      };
  stock: number;
  isAvailable: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

export interface OrderProduct {
  product:
    | string
    | {
        _id: string;
        name: string;
        image?: string;
      };
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  user:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
  products: OrderProduct[];
  totalPrice: number;
  address: string;
  phone: string;
  status: OrderStatus;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}
