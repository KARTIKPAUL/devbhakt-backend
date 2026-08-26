// Single source of truth for product "types" sold on Kartikeyo.
// The frontend has a matching copy at:
//   Kartikeyo-frontend/lib/productTaxonomy.js
// Keep both in sync when you add a new product type (e.g. "puja-thali" later).
//
// productType   -> broad grouping used for filtering/nav (Clothing, Murti, etc.)
// category      -> free-text sub-category within a type (already existed on Product)
// hasVariants   -> whether this type typically needs a variant selector (size/mukhi/height)
// variantLabel  -> what to call that selector in the UI ("Size", "Mukhi", "Height"...)

export const PRODUCT_TYPES = [
  {
    value: "clothing",
    label: "Clothing",
    categories: ["T-Shirt", "Hoodie", "Tote Bag"],
    hasVariants: true,
    variantLabel: "Size",
  },
  {
    value: "murti",
    label: "Murti & Idols",
    categories: [
      "Shiv Ling",
      "Ganesh Murti",
      "Krishna Murti",
      "Hanuman Murti",
      "Durga Murti",
      "Radha Krishna",
      "Other Murti",
    ],
    hasVariants: true,
    variantLabel: "Height",
  },
  {
    value: "rudraksha",
    label: "Rudraksha & Mala",
    categories: ["Rudraksha Bead", "Rudraksha Mala", "Rudraksha Bracelet", "Gemstone Mala"],
    hasVariants: true,
    variantLabel: "Mukhi",
  },
  {
    value: "book",
    label: "Puja Books",
    categories: ["Chalisa", "Aarti Sangrah", "Vrat Katha", "Bhagavad Gita", "Ramayan", "Other Book"],
    hasVariants: false,
    variantLabel: "Edition",
  },
  {
    value: "accessory",
    label: "Puja Accessories",
    categories: ["Puja Thali", "Incense & Dhoop", "Diya", "Kalash", "Bell (Ghanti)", "Other Accessory"],
    hasVariants: false,
    variantLabel: "Variant",
  },
];

export const PRODUCT_TYPE_VALUES = PRODUCT_TYPES.map((t) => t.value);

export const isValidProductType = (value) => PRODUCT_TYPE_VALUES.includes(value);
