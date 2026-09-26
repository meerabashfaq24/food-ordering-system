import api from "./api";

export interface Restaurant {
  _id: string;
  user: string;
  name: string;
  description: string;
  city: string;
  address: string;
  cuisines: string[];
  imageUrl: string;
  deliveryPrice: number;
  estimatedDeliveryTime: number;
  isActive: boolean;
}

export interface RestaurantResponse {
  success: boolean;
  message: string;
  data: {
    restaurants: Restaurant[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface RestaurantSingleResponse {
  success: boolean;
  message: string;
  data: Restaurant;
}

export interface RestaurantFormData {
  name: string;
  description: string;
  city: string;
  address: string;
  cuisines: string[];
  imageUrl: string;
  deliveryPrice: number;
  estimatedDeliveryTime: number;
  isActive: boolean;
}

export const getRestaurants = async (params?: {
  search?: string;
  city?: string;
  cuisine?: string;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<RestaurantResponse>(
    "/restaurants",
    {
      params,
    }
  );

  return response.data;
};

export const getRestaurantById = async (
  id: string
) => {
  const response = await api.get<RestaurantSingleResponse>(
    `/restaurants/${id}`
  );

  return response.data;
};

export const getMyRestaurant = async (
  token: string
) => {
  const response = await api.get<RestaurantSingleResponse>(
    "/restaurants/owner/me",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const createRestaurant = async (
  data: RestaurantFormData,
  token: string
) => {
  const response = await api.post<RestaurantSingleResponse>(
    "/restaurants",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};

export const updateMyRestaurant = async (
  data: Partial<RestaurantFormData>,
  token: string
) => {
  const response = await api.put<RestaurantSingleResponse>(
    "/restaurants/owner/me",
    data,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};