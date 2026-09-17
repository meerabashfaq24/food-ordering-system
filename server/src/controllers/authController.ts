
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/authMiddleware";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { ApiResponse, UserRole } from "../types";

const generateToken = (id: string, role: UserRole): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id,
      role,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (String(password).length < 6) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      } satisfies ApiResponse<never>);
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      } satisfies ApiResponse<never>);
      return;
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER,
    });

    const token = generateToken(user._id.toString(), user.role);

    const response: ApiResponse<{
      user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      };
      token: string;
    }> = {
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
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    } satisfies ApiResponse<never>);
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      } satisfies ApiResponse<never>);
      return;
    }

    const passwordMatches = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      } satisfies ApiResponse<never>);
      return;
    }

    const token = generateToken(user._id.toString(), user.role);

    const response: ApiResponse<{
      user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
      };
      token: string;
    }> = {
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
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login.",
    } satisfies ApiResponse<never>);
  }
};

export const createAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password, setupKey } = req.body;

    if (!name || !email || !password || !setupKey) {
      res.status(400).json({
        success: false,
        message: "Name, email, password and setup key are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      res.status(403).json({
        success: false,
        message: "Invalid admin setup key.",
      } satisfies ApiResponse<never>);
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      if (existingUser.role === UserRole.ADMIN) {
        res.status(409).json({
          success: false,
          message: "Admin account already exists.",
        } satisfies ApiResponse<never>);
        return;
      }

      existingUser.role = UserRole.ADMIN;
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

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const admin = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });

    const token = generateToken(
      admin._id.toString(),
      admin.role
    );

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
  } catch (error) {
    console.error("Create admin error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create admin.",
    } satisfies ApiResponse<never>);
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated.",
      } satisfies ApiResponse<never>);
      return;
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      } satisfies ApiResponse<never>);
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
  } catch (error) {
    console.error("Get profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while fetching profile.",
    } satisfies ApiResponse<never>);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Not authenticated.",
      } satisfies ApiResponse<never>);
      return;
    }

    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "Name and email are required.",
      } satisfies ApiResponse<never>);
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      } satisfies ApiResponse<never>);
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found.",
      } satisfies ApiResponse<never>);
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
  } catch (error) {
    console.error("Update profile error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating profile.",
    } satisfies ApiResponse<never>);
  }
};

