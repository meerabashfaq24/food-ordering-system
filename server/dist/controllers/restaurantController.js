"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRestaurantById = exports.getRestaurants = exports.updateMyRestaurant = exports.getMyRestaurant = exports.createRestaurant = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Restaurant_1 = __importDefault(require("../models/Restaurant"));
const getUserId = (req) => {
    return req.user?.id;
};
const createRestaurant = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const { name, description, city, address, cuisines, imageUrl, deliveryPrice, estimatedDeliveryTime, } = req.body;
        if (!name ||
            !description ||
            !city ||
            !address) {
            res.status(400).json({
                success: false,
                message: "Name, description, city and address are required.",
            });
            return;
        }
        const existingRestaurant = await Restaurant_1.default.findOne({
            user: userId,
        });
        if (existingRestaurant) {
            res.status(409).json({
                success: false,
                message: "You already have a restaurant.",
            });
            return;
        }
        const restaurant = await Restaurant_1.default.create({
            user: userId,
            name: String(name).trim(),
            description: String(description).trim(),
            city: String(city).trim(),
            address: String(address).trim(),
            cuisines: Array.isArray(cuisines)
                ? cuisines.map((item) => String(item).trim())
                : [],
            imageUrl: imageUrl
                ? String(imageUrl).trim()
                : "",
            deliveryPrice: Number(deliveryPrice) || 0,
            estimatedDeliveryTime: Number(estimatedDeliveryTime) || 30,
            isActive: true,
        });
        res.status(201).json({
            success: true,
            message: "Restaurant created successfully.",
            data: restaurant,
        });
    }
    catch (error) {
        console.error("Create restaurant error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create restaurant.",
        });
    }
};
exports.createRestaurant = createRestaurant;
const getMyRestaurant = async (req, res) => {
    try {
        const userId = getUserId(req);
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
        res.status(200).json({
            success: true,
            message: "Restaurant retrieved successfully.",
            data: restaurant,
        });
    }
    catch (error) {
        console.error("Get my restaurant error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve restaurant.",
        });
    }
};
exports.getMyRestaurant = getMyRestaurant;
const updateMyRestaurant = async (req, res) => {
    try {
        const userId = getUserId(req);
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
        const { name, description, city, address, cuisines, imageUrl, deliveryPrice, estimatedDeliveryTime, isActive, } = req.body;
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
                    message: "Cuisines must be an array.",
                });
                return;
            }
            restaurant.cuisines =
                cuisines.map((item) => String(item).trim());
        }
        if (imageUrl !== undefined) {
            restaurant.imageUrl =
                String(imageUrl).trim();
        }
        if (deliveryPrice !== undefined) {
            restaurant.deliveryPrice =
                Number(deliveryPrice);
        }
        if (estimatedDeliveryTime !== undefined) {
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
            message: "Restaurant updated successfully.",
            data: restaurant,
        });
    }
    catch (error) {
        console.error("Update restaurant error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update restaurant.",
        });
    }
};
exports.updateMyRestaurant = updateMyRestaurant;
const getRestaurants = async (req, res) => {
    try {
        const { search, city, cuisine, sort, page = "1", limit = "6", } = req.query;
        const pageNumber = Math.max(1, Number(page) || 1);
        const limitNumber = Math.min(50, Math.max(1, Number(limit) || 6));
        const filter = {
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
        let sortOption;
        if (sort === "deliveryPrice") {
            sortOption = {
                deliveryPrice: 1,
            };
        }
        else if (sort === "deliveryTime") {
            sortOption = {
                estimatedDeliveryTime: 1,
            };
        }
        else {
            sortOption = {
                createdAt: -1,
            };
        }
        const total = await Restaurant_1.default.countDocuments(filter);
        const restaurants = await Restaurant_1.default.find(filter)
            .sort(sortOption)
            .skip((pageNumber - 1) * limitNumber)
            .limit(limitNumber);
        res.status(200).json({
            success: true,
            message: "Restaurants retrieved successfully.",
            data: {
                restaurants,
                pagination: {
                    page: pageNumber,
                    limit: limitNumber,
                    total,
                    totalPages: Math.ceil(total / limitNumber),
                },
            },
        });
    }
    catch (error) {
        console.error("Get restaurants error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve restaurants.",
        });
    }
};
exports.getRestaurants = getRestaurants;
const getRestaurantById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.default.Types.ObjectId.isValid(String(id))) {
            res.status(400).json({
                success: false,
                message: "Invalid restaurant ID.",
            });
            return;
        }
        const restaurant = await Restaurant_1.default.findOne({
            _id: id,
            isActive: true,
        }).populate("user", "name email");
        if (!restaurant) {
            res.status(404).json({
                success: false,
                message: "Restaurant not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Restaurant retrieved successfully.",
            data: restaurant,
        });
    }
    catch (error) {
        console.error("Get restaurant by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve restaurant.",
        });
    }
};
exports.getRestaurantById = getRestaurantById;
//# sourceMappingURL=restaurantController.js.map