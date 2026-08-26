import Product from "../models/Product.js";
import asyncHandler from "../utils/asyncHandler.js";
import { isValidProductType } from "../config/productTaxonomy.js";

// `attributes` arrives as a JSON string when the request is multipart
// (product create/update uses multer for image uploads), or as a real array
// when the request is plain JSON. Handle both, and drop malformed rows
// instead of failing the whole request.
const parseAttributes = (raw) => {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) {
    return raw.filter((a) => a && a.label && a.value);
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((a) => a && a.label && a.value) : [];
  } catch {
    return [];
  }
};

const parseBoolean = (raw) => raw === true || raw === "true";

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// @desc    List products with search/filter/pagination (public storefront)
// @route   GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, collection, type, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;

  const query = { isActive: true };

  if (search) query.$text = { $search: search };
  if (type) query.productType = type;
  if (category) query.category = category;
  if (collection) query.collectionName = collection;
  if (minPrice || maxPrice) {
    query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    "price-asc": { price: 1 },
    "price-desc": { price: -1 },
    newest: { createdAt: -1 },
  };

  const pageNum = Math.max(1, Number(page));
  const limitNum = Math.min(50, Math.max(1, Number(limit)));

  const [products, total] = await Promise.all([
    Product.find(query)
      .sort(sortMap[sort] || { createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    Product.countDocuments(query),
  ]);

  res.json({
    success: true,
    products,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    total,
  });
});

// @desc    Get a single product by id or slug (public)
// @route   GET /api/products/:idOrSlug
export const getProductById = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);

  const product = await Product.findOne(isObjectId ? { _id: idOrSlug } : { slug: idOrSlug });

  if (!product || !product.isActive) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.json({ success: true, product });
});

// @desc    Create a product (admin)
// @route   POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name, description, category, collectionName, productType,
    price, discountPrice, sizes, stock, sku, images, supplierSource, isFeatured,
    material, origin, isCertified, certificateImage, attributes,
  } = req.body;

  if (!name || !description || !category || price === undefined) {
    res.status(400);
    throw new Error("name, description, category and price are required");
  }

  if (productType && !isValidProductType(productType)) {
    res.status(400);
    throw new Error("Invalid productType");
  }

  let slug = slugify(name);
  const slugExists = await Product.findOne({ slug });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const uploadedImages = (req.files || []).map((f) => f.path);
  const finalImages = uploadedImages.length ? uploadedImages : images || [];

  if (!finalImages.length) {
    res.status(400);
    throw new Error("At least one product image is required");
  }

  const product = await Product.create({
    name,
    slug,
    description,
    productType: productType || "clothing",
    category,
    collectionName,
    price,
    discountPrice,
    sizes,
    stock: stock || 0,
    sku,
    images: finalImages,
    supplierSource,
    isFeatured: !!isFeatured,
    material,
    origin,
    isCertified: parseBoolean(isCertified),
    certificateImage,
    attributes: parseAttributes(attributes) || [],
  });

  res.status(201).json({ success: true, product });
});

// @desc    Update a product (admin)
// @route   PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  if (req.body.productType !== undefined && !isValidProductType(req.body.productType)) {
    res.status(400);
    throw new Error("Invalid productType");
  }

  const updatable = [
    "name", "description", "category", "collectionName", "productType",
    "price", "discountPrice", "sizes", "stock", "sku",
    "supplierSource", "isActive", "isFeatured",
    "material", "origin", "certificateImage",
  ];
  updatable.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  if (req.body.isCertified !== undefined) {
    product.isCertified = parseBoolean(req.body.isCertified);
  }
  if (req.body.attributes !== undefined) {
    product.attributes = parseAttributes(req.body.attributes) || [];
  }

  if (req.body.name) {
    const newSlug = slugify(req.body.name);
    if (newSlug !== product.slug) {
      const exists = await Product.findOne({ slug: newSlug, _id: { $ne: product._id } });
      product.slug = exists ? `${newSlug}-${Date.now().toString(36)}` : newSlug;
    }
  }

  const uploadedImages = (req.files || []).map((f) => f.path);
  if (uploadedImages.length) product.images = [...product.images, ...uploadedImages];
  if (req.body.images) product.images = req.body.images;

  await product.save();
  res.json({ success: true, product });
});

// @desc    Deactivate a product (admin) — soft delete so past orders keep valid references
// @route   DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: "Product deactivated" });
});

// @desc    List every product, including inactive ones (admin)
// @route   GET /api/products/admin/all
export const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json({ success: true, products });
});
