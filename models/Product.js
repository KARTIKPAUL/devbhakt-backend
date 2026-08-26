import mongoose from "mongoose";
import { PRODUCT_TYPE_VALUES } from "../config/productTaxonomy.js";

// The broad department a product belongs to. Drives which category options
// and which variant label (Size / Height / Mukhi / etc.) the storefront and
// admin form show. Add new values in config/productTaxonomy.js as the
// catalog grows (e.g. "puja-samagri") — this file reads from there so the
// enum stays in sync with the categories/variant-label config.
const PRODUCT_TYPES = PRODUCT_TYPE_VALUES;

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },

    // Department (clothing / murti / rudraksha / book / accessory). Kept as
    // its own field — separate from `category` — so the storefront can group
    // and filter at a higher level than the specific category string.
    productType: {
      type: String,
      required: true,
      enum: PRODUCT_TYPES,
      default: "clothing",
      index: true,
    },

    category: { type: String, required: true }, // e.g. "T-Shirt", "Shiv Ling", "Rudraksha Mala"
    collectionName: { type: String }, // e.g. "Mahadev Collection", "Sanskrit Collection"
    images: [{ type: String, required: true }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },

    // Generic variant list. For clothing this holds sizes (S/M/L...); for
    // murtis it can hold heights ("6 inch", "12 inch"); for rudraksha it can
    // hold mukhi counts ("5 Mukhi", "Gauri Shankar"). Field name kept as
    // `sizes` for backward compatibility with existing orders/cart code that
    // already treats it as an arbitrary string.
    sizes: [{ type: String }],

    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    supplierSource: { type: String }, // internal ops note, never exposed to the storefront response by itself
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },

    // --- Spiritual-store trust fields (murti / rudraksha / accessories) ---
    material: { type: String, trim: true }, // e.g. "Brass", "Marble", "Panchdhatu", "Cotton"
    origin: { type: String, trim: true }, // e.g. "Nepal", "Rajasthan", "Java"
    isCertified: { type: Boolean, default: false }, // lab-certified rudraksha, hallmark, etc.
    certificateImage: { type: String }, // URL to a certificate/authenticity proof image

    // Free-form spec sheet — used for anything that doesn't need its own
    // column: mukhi, weight, dimensions, author, publisher, language,
    // binding, fabric, fit... Add rows here rather than adding new schema
    // fields for every product type.
    attributes: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

productSchema.index({
  name: "text",
  description: "text",
  category: "text",
  collectionName: "text",
  material: "text",
});

productSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
