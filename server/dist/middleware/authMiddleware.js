"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOnly = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const types_1 = require("../types");
const protect = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};
exports.protect = protect;
const adminOnly = (req, res, next) => {
    if (req.user?.role !== types_1.UserRole.ADMIN) {
        res.status(403).json({
            success: false,
            message: "Admin access required.",
        });
        return;
    }
    next();
};
exports.adminOnly = adminOnly;
//# sourceMappingURL=authMiddleware.js.map