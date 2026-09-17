import axios from "axios";
import type { Cart, ApiResponse } from "../types";

const API_URL = "http://localhost:5000/api";

export const getCart = async (
  token: string
): Promise<ApiResponse<Cart>> => {
  const response = await axios.get<ApiResponse<Cart>>(
    `${API_URL}/cart`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const addToCart = async (
  productId: string,
  quantity: number,
  token: string
): Promise<ApiResponse<Cart>> => {
  const response = await axios.post<ApiResponse<Cart>>(
    `${API_URL}/cart/items`,
    {
      productId,
      quantity,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateCartItem = async (
  productId: string,
  quantity: number,
  token: string
): Promise<ApiResponse<Cart>> => {
  const response = await axios.put<ApiResponse<Cart>>(
    `${API_URL}/cart/items/${productId}`,
    {
      quantity,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const removeCartItem = async (
  productId: string,
  token: string
): Promise<ApiResponse<Cart>> => {
  const response = await axios.delete<ApiResponse<Cart>>(
    `${API_URL}/cart/items/${productId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const clearCart = async (
  token: string
): Promise<ApiResponse<Cart>> => {
  const response = await axios.delete<ApiResponse<Cart>>(
    `${API_URL}/cart`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};