"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.get("/", productController_1.getProducts);
router.get("/:id", productController_1.getProductById);
router.post("/", authMiddleware_1.protect, productController_1.createProduct);
router.put("/:id", authMiddleware_1.protect, productController_1.updateProduct);
router.delete("/:id", authMiddleware_1.protect, productController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map