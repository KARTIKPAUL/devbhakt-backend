import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    description: { type: String, required: true },
    category: { type: String, required: true }, // e.g. "T-Shirt", "Hoodie", "Tote Bag"
    collectionName: { type: String }, // e.g. "Mahadev Collection", "Sanskrit Collection"
    images: [{ type: String, required: true }],
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    sizes: [{ type: String }], // e.g. ["S", "M", "L", "XL"]
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, unique: true, sparse: true },
    supplierSource: { type: String }, // internal ops note, never exposed to the storefront response by itself
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", category: "text", collectionName: "text" });

productSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
});

productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

export default mongoose.model("Product", productSchema);
