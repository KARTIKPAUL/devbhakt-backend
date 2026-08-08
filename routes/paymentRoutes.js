import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/create-order/:orderId", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);

export default router;
