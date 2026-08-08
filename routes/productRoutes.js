import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} from "../controllers/productController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

// NOTE: /admin/all must be declared before /:idOrSlug or Express would treat
// "admin" as a slug value.
router.get("/admin/all", protect, adminOnly, getAllProductsAdmin);

router.get("/", getProducts);
router.get("/:idOrSlug", getProductById);

router.post("/", protect, adminOnly, upload.array("images", 6), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 6), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
