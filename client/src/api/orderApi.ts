import api from "./api";
import type { Order, OrderStatus } from "../types";

export interface OrdersResponse {
  success: boolean;
  message: string;
  data: Order[];
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export const getMyOrders = async (
  token: string
): Promise<OrdersResponse> => {
  const response = await api.get<OrdersResponse>(
    "/orders/my-orders",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const getRestaurantOrders = async (
  token: string
): Promise<OrdersResponse> => {
  const response = await api.get<OrdersResponse>(
    "/orders",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
  token: string
): Promise<OrderResponse> => {
  const response = await api.put<OrderResponse>(
    `/orders/${orderId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};