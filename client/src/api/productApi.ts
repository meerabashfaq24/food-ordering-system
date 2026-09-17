import axios from "axios";
import type { Product, Category } from "../types";

const API_URL = "http://localhost:5000/api";

export interface ProductResponse {
  success: boolean;
  message: string;
  data: Product;
}

export interface ProductsResponse {
  success: boolean;
  message: string;
  data: Product[];
}

export interface CategoriesResponse {
  success: boolean;
  message: string;
  data: Category[];
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  image: string;
  restaurant: string;
  category: string;
  stock: number;
  isAvailable: boolean;
}

export const getProducts = async (
  restaurant?: string
): Promise<ProductsResponse> => {
  const response = await axios.get<ProductsResponse>(
    `${API_URL}/products`,
    {
      params: restaurant ? { restaurant } : undefined,
    }
  );

  return response.data;
};

export const getCategories =
  async (): Promise<CategoriesResponse> => {
    const response = await axios.get<CategoriesResponse>(
      `${API_URL}/categories`
    );

    return response.data;
  };

export const createProduct = async (
  data: ProductFormData,
  token: string
): Promise<ProductResponse> => {
  const response = await axios.post<ProductResponse>(
    `${API_URL}/products`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateProduct = async (
  id: string,
  data: Partial<ProductFormData> & {
    isAvailable?: boolean;
  },
  token: string
): Promise<ProductResponse> => {
  const response = await axios.put<ProductResponse>(
    `${API_URL}/products/${id}`,
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const deleteProduct = async (
  id: string,
  token: string
): Promise<void> => {
  await axios.delete(`${API_URL}/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};