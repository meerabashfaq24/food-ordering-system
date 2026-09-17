import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload, UserRole } from "../types";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const protect = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Not authorized. Token required.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      res.status(500).json({
        success: false,
        message: "JWT secret is not configured.",
      });
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const adminOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
    return;
  }

  next();
};
