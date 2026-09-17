"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = exports.createAdmin = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const types_1 = require("../types");
const generateToken = (id, role) => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured.");
    }
    return jsonwebtoken_1.default.sign({
        id,
        role,
    }, secret, {
        expiresIn: "7d",
    });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({
                success: false,
                message: "Name, email and password are required.",
            });
            return;
        }
        if (String(password).length < 6) {
            res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters.",
            });
            return;
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User_1.default.findOne({
            email: normalizedEmail,
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(String(password), 10);
        const user = await User_1.default.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: types_1.UserRole.USER,
        });
        const token = generateToken(user._id.toString(), user.role);
        const response = {
            success: true,
            message: "Registration successful.",
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during registration.",
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({
                success: false,
                message: "Email and password are required.",
            });
            return;
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const user = await User_1.default.findOne({
            email: normalizedEmail,
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
            return;
        }
        const passwordMatches = await bcryptjs_1.default.compare(String(password), user.password);
        if (!passwordMatches) {
            res.status(401).json({
                success: false,
                message: "Invalid email or password.",
            });
            return;
        }
        const token = generateToken(user._id.toString(), user.role);
        const response = {
            success: true,
            message: "Login successful.",
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
                token,
            },
        };
        res.status(200).json(response);
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Server error during login.",
        });
    }
};
exports.login = login;
const createAdmin = async (req, res) => {
    try {
        const { name, email, password, setupKey } = req.body;
        if (!name || !email || !password || !setupKey) {
            res.status(400).json({
                success: false,
                message: "Name, email, password and setup key are required.",
            });
            return;
        }
        if (setupKey !== process.env.ADMIN_SETUP_KEY) {
            res.status(403).json({
                success: false,
                message: "Invalid admin setup key.",
            });
            return;
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User_1.default.findOne({
            email: normalizedEmail,
        });
        if (existingUser) {
            if (existingUser.role === types_1.UserRole.ADMIN) {
                res.status(409).json({
                    success: false,
                    message: "Admin account already exists.",
                });
                return;
            }
            existingUser.role = types_1.UserRole.ADMIN;
            await existingUser.save();
            res.status(200).json({
                success: true,
                message: "Existing user promoted to admin.",
                data: {
                    id: existingUser._id.toString(),
                    email: existingUser.email,
                    role: existingUser.role,
                },
            });
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(String(password), 10);
        const admin = await User_1.default.create({
            name: String(name).trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: types_1.UserRole.ADMIN,
        });
        const token = generateToken(admin._id.toString(), admin.role);
        res.status(201).json({
            success: true,
            message: "Admin account created successfully.",
            data: {
                user: {
                    id: admin._id.toString(),
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                },
                token,
            },
        });
    }
    catch (error) {
        console.error("Create admin error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create admin.",
        });
    }
};
exports.createAdmin = createAdmin;
const getProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated.",
            });
            return;
        }
        const user = await User_1.default.findById(req.user.id).select("-password");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: "Profile fetched successfully.",
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching profile.",
        });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: "Not authenticated.",
            });
            return;
        }
        const { name, email } = req.body;
        if (!name || !email) {
            res.status(400).json({
                success: false,
                message: "Name and email are required.",
            });
            return;
        }
        const normalizedEmail = String(email).toLowerCase().trim();
        const existingUser = await User_1.default.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user.id },
        });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: "An account with this email already exists.",
            });
            return;
        }
        const user = await User_1.default.findById(req.user.id);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }
        user.name = String(name).trim();
        user.email = normalizedEmail;
        await user.save();
        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while updating profile.",
        });
    }
};
exports.updateProfile = updateProfile;
//# sourceMappingURL=authController.js.map