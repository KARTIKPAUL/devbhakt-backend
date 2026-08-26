import Order from "../models/Order.js";
import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { orderConfirmationTemplate } from "../utils/emailTemplates.js";

const SHIPPING_FLAT_RATE = Number(process.env.SHIPPING_FLAT_RATE || 0);

// Recomputes item prices from the database. The frontend cart is only ever
// treated as a list of {productId, quantity, size} — prices are never trusted
// from the client, per the plan's "never trust the frontend" principle.
const buildOrderItems = async (cartItems) => {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const err = new Error("Order must contain at least one item");
    err.statusCode = 400;
    throw err;
  }

  const orderItems = [];
  let itemsPrice = 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.productId);

    if (!product || !product.isActive) {
      const err = new Error(`Product not available: ${item.productId}`);
      err.statusCode = 400;
      throw err;
    }

    const quantity = Number(item.quantity) || 1;

    if (product.stock < quantity) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }

    const price =
      product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;

    itemsPrice += price * quantity;

    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.images?.[0],
      price,
      size: item.size,
      quantity,
    });
  }

  return { orderItems, itemsPrice };
};

// @desc    Create a new order. COD orders are confirmed immediately; ONLINE
//          orders are created unpaid and confirmed once Razorpay verifies.
// @route   POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!shippingAddress) {
    res.status(400);
    throw new Error("Shipping address is required");
  }

  if (!["COD", "ONLINE"].includes(paymentMethod)) {
    res.status(400);
    throw new Error("paymentMethod must be COD or ONLINE");
  }

  const { orderItems, itemsPrice } = await buildOrderItems(items);
  const shippingPrice = itemsPrice > 0 ? SHIPPING_FLAT_RATE : 0;
  const totalPrice = itemsPrice + shippingPrice;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    shippingPrice,
    totalPrice,
  });

  if (paymentMethod === "COD") {
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } });
    }

    sendEmail({
      to: req.user.email,
      subject: `Kartikeyo order confirmed — #${order._id}`,
      html: orderConfirmationTemplate(order),
    });
  }
  // ONLINE orders decrement stock and send the confirmation email only after
  // the Razorpay signature is verified — see paymentController.

  res.status(201).json({ success: true, order });
});

// @desc    Get the logged-in user's own order history
// @route   GET /api/orders/my
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

// @desc    Get a single order (owner or admin only)
// @route   GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  const isOwner = order.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }

  res.json({ success: true, order });
});

// @desc    List all orders, optionally filtered by status (admin)
// @route   GET /api/orders
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (status) query.orderStatus = status;

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(100, Math.max(1, Number(limit)));

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, orders, page: pageNum, pages: Math.ceil(total / limitNum), total });
});

// @desc    Update an order's status (admin)
// @route   PUT /api/orders/:id/status
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;
  const validStatuses = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

  if (!validStatuses.includes(orderStatus)) {
    res.status(400);
    throw new Error(`orderStatus must be one of: ${validStatuses.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.orderStatus = orderStatus;

  if (orderStatus === "DELIVERED") {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  await order.save();
  res.json({ success: true, order });
});
