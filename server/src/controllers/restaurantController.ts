import { Response } from "express";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import { ApiResponse } from "../types";

const getUserId = (
  req: AuthenticatedRequest
): string | undefined => {
  return req.user?.id;
};

export const createRestaurant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const {
      name,
      description,
      city,
      address,
      cuisines,
      imageUrl,
      deliveryPrice,
      estimatedDeliveryTime,
    } = req.body;

    if (
      !name ||
      !description ||
      !city ||
      !address
    ) {
      res.status(400).json({
        success: false,
        message:
          "Name, description, city and address are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const existingRestaurant =
      await Restaurant.findOne({
        user: userId,
      });

    if (existingRestaurant) {
      res.status(409).json({
        success: false,
        message:
          "You already have a restaurant.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurant = await Restaurant.create({
      user: userId,
      name: String(name).trim(),
      description: String(description).trim(),
      city: String(city).trim(),
      address: String(address).trim(),
      cuisines: Array.isArray(cuisines)
        ? cuisines.map((item) =>
            String(item).trim()
          )
        : [],
      imageUrl: imageUrl
        ? String(imageUrl).trim()
        : "",
      deliveryPrice:
        Number(deliveryPrice) || 0,
      estimatedDeliveryTime:
        Number(estimatedDeliveryTime) || 30,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message:
        "Restaurant created successfully.",
      data: restaurant,
    } satisfies ApiResponse<
      typeof restaurant
    >);
  } catch (error) {
    console.error(
      "Create restaurant error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create restaurant.",
    } satisfies ApiResponse<never>);
  }
};

export const getMyRestaurant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurant =
      await Restaurant.findOne({
        user: userId,
      });

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Restaurant retrieved successfully.",
      data: restaurant,
    } satisfies ApiResponse<
      typeof restaurant
    >);
  } catch (error) {
    console.error(
      "Get my restaurant error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve restaurant.",
    } satisfies ApiResponse<never>);
  }
};

export const updateMyRestaurant = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurant =
      await Restaurant.findOne({
        user: userId,
      });

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    const {
      name,
      description,
      city,
      address,
      cuisines,
      imageUrl,
      deliveryPrice,
      estimatedDeliveryTime,
      isActive,
    } = req.body;

    if (name !== undefined) {
      restaurant.name =
        String(name).trim();
    }

    if (description !== undefined) {
      restaurant.description =
        String(description).trim();
    }

    if (city !== undefined) {
      restaurant.city =
        String(city).trim();
    }

    if (address !== undefined) {
      restaurant.address =
        String(address).trim();
    }

    if (cuisines !== undefined) {
      if (!Array.isArray(cuisines)) {
        res.status(400).json({
          success: false,
          message:
            "Cuisines must be an array.",
        } satisfies ApiResponse<never>);
        return;
      }

      restaurant.cuisines =
        cuisines.map((item) =>
          String(item).trim()
        );
    }

    if (imageUrl !== undefined) {
      restaurant.imageUrl =
        String(imageUrl).trim();
    }

    if (deliveryPrice !== undefined) {
      restaurant.deliveryPrice =
        Number(deliveryPrice);
    }

    if (
      estimatedDeliveryTime !== undefined
    ) {
      restaurant.estimatedDeliveryTime =
        Number(estimatedDeliveryTime);
    }

    if (isActive !== undefined) {
      restaurant.isActive =
        Boolean(isActive);
    }

    await restaurant.save();

    res.status(200).json({
      success: true,
      message:
        "Restaurant updated successfully.",
      data: restaurant,
    } satisfies ApiResponse<
      typeof restaurant
    >);
  } catch (error) {
    console.error(
      "Update restaurant error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update restaurant.",
    } satisfies ApiResponse<never>);
  }
};

export const getRestaurants = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      search,
      city,
      cuisine,
      sort,
      page = "1",
      limit = "6",
    } = req.query;

    const pageNumber = Math.max(
      1,
      Number(page) || 1
    );

    const limitNumber = Math.min(
      50,
      Math.max(1, Number(limit) || 6)
    );

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (city) {
      filter.city = {
        $regex: String(city),
        $options: "i",
      };
    }

    if (cuisine) {
      filter.cuisines = {
        $in: [String(cuisine)],
      };
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: String(search),
            $options: "i",
          },
        },
        {
          description: {
            $regex: String(search),
            $options: "i",
          },
        },
        {
          city: {
            $regex: String(search),
            $options: "i",
          },
        },
        {
          cuisines: {
            $regex: String(search),
            $options: "i",
          },
        },
      ];
    }

    let sortOption:
      | Record<string, 1 | -1>
      | undefined;

    if (sort === "deliveryPrice") {
      sortOption = {
        deliveryPrice: 1,
      };
    } else if (
      sort === "deliveryTime"
    ) {
      sortOption = {
        estimatedDeliveryTime: 1,
      };
    } else {
      sortOption = {
        createdAt: -1,
      };
    }

    const total =
      await Restaurant.countDocuments(filter);

    const restaurants =
      await Restaurant.find(filter)
        .sort(sortOption)
        .skip(
          (pageNumber - 1) * limitNumber
        )
        .limit(limitNumber);

    res.status(200).json({
      success: true,
      message:
        "Restaurants retrieved successfully.",
      data: {
        restaurants,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(
            total / limitNumber
          ),
        },
      },
    });
  } catch (error) {
    console.error(
      "Get restaurants error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve restaurants.",
    } satisfies ApiResponse<never>);
  }
};

export const getRestaurantById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        String(id)
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid restaurant ID.",
      } satisfies ApiResponse<never>);
      return;
    }

    const restaurant =
      await Restaurant.findOne({
        _id: id,
        isActive: true,
      }).populate(
        "user",
        "name email"
      );

    if (!restaurant) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      } satisfies ApiResponse<never>);
      return;
    }

    res.status(200).json({
      success: true,
      message:
        "Restaurant retrieved successfully.",
      data: restaurant,
    } satisfies ApiResponse<
      typeof restaurant
    >);
  } catch (error) {
    console.error(
      "Get restaurant by ID error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to retrieve restaurant.",
    } satisfies ApiResponse<never>);
  }
};
