import crypto from "crypto";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { welcomeEmailTemplate, passwordResetTemplate } from "../utils/emailTemplates.js";

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({ name, email, password, phone });

  sendEmail({
    to: user.email,
    subject: "Welcome to Kartikeyo",
    html: welcomeEmailTemplate(user.name),
  });

  res.status(201).json({
    success: true,
    user: user.toSafeObject(),
    token: generateToken(user._id, user.role),
  });
});

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  res.json({
    success: true,
    user: user.toSafeObject(),
    token: generateToken(user._id, user.role),
  });
});

// @desc    Get logged-in user's profile
// @route   GET /api/auth/me
export const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update logged-in user's profile
// @route   PUT /api/auth/me
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;

  await req.user.save();
  res.json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Add a new address to the logged-in user
// @route   POST /api/auth/addresses
export const addAddress = asyncHandler(async (req, res) => {
  const { label, fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    res.status(400);
    throw new Error("fullName, phone, addressLine1, city, state and pincode are required");
  }

  if (isDefault) {
    req.user.addresses.forEach((a) => (a.isDefault = false));
  }

  req.user.addresses.push({
    label,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    pincode,
    country: country || "India",
    isDefault: !!isDefault || req.user.addresses.length === 0,
  });

  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

// @desc    Delete one of the logged-in user's addresses
// @route   DELETE /api/auth/addresses/:addressId
export const deleteAddress = asyncHandler(async (req, res) => {
  req.user.addresses = req.user.addresses.filter((a) => a._id.toString() !== req.params.addressId);
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = email ? await User.findOne({ email: email.toLowerCase() }) : null;

  // Respond identically whether or not the account exists, so the endpoint
  // can't be used to enumerate registered emails.
  const genericResponse = { success: true, message: "If that account exists, a reset email has been sent" };

  if (!user) {
    return res.json(genericResponse);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Reset your Kartikeyo password",
    html: passwordResetTemplate(resetUrl),
  });

  res.json(genericResponse);
});

// @desc    Reset password using the token emailed to the user
// @route   POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }).select("+passwordResetToken +passwordResetExpires");

  if (!user) {
    res.status(400);
    throw new Error("Reset link is invalid or has expired");
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.json({ success: true, message: "Password has been reset. You can now log in." });
});
