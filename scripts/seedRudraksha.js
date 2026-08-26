// Inserts one dummy Rudraksha product so you can see the new Murti/Rudraksha
// UI (variant = Mukhi, Material/Origin/Certified badges, Specifications) on
// your live frontend without going through the admin form.
//
// Usage:
//   node scripts/seedRudraksha.js
//
// Safe to re-run — it upserts by slug, so running it twice won't create
// duplicates.
import "dotenv/config";
import mongoose from "mongoose";
import Product from "../models/Product.js";

const DUMMY_RUDRAKSHA = {
  name: "5 Mukhi Rudraksha Mala",
  slug: "5-mukhi-rudraksha-mala",
  description:
    "A traditional 5 Mukhi (five-faced) Rudraksha mala of 108 beads, sourced from Nepal and strung on a natural cotton thread. Worn for daily japa and meditation, and believed to bring calm, focus and protection to the wearer. Each bead is hand-selected and lab-tested for authenticity.",
  productType: "rudraksha",
  category: "Rudraksha Mala",
  collectionName: "Himalayan Rudraksha",
  images: [
    "https://images.unsplash.com/photo-1620656798579-1984d9e87df7?w=800&q=80",
    "https://images.unsplash.com/photo-1601049676869-702ea24cfd58?w=800&q=80",
  ],
  price: 1299,
  discountPrice: 999,
  sizes: ["5 Mukhi"], // this is the Mukhi/variant field
  stock: 25,
  sku: "RUD-5M-108",
  material: "Rudraksha Seed (Nepal origin)",
  origin: "Nepal",
  isCertified: true,
  certificateImage: "https://images.unsplash.com/photo-1568402102990-bc541580b59f?w=600&q=80",
  attributes: [
    { label: "Bead Count", value: "108 + 1 Guru Bead" },
    { label: "Bead Size", value: "6-7 mm" },
    { label: "Thread Type", value: "Natural Cotton" },
    { label: "Origin", value: "Nepal" },
  ],
  isFeatured: true,
  isActive: true,
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Product.findOne({ slug: DUMMY_RUDRAKSHA.slug });

  if (existing) {
    Object.assign(existing, DUMMY_RUDRAKSHA);
    await existing.save();
    console.log(`Updated existing dummy product: ${DUMMY_RUDRAKSHA.name} (${DUMMY_RUDRAKSHA.slug})`);
  } else {
    await Product.create(DUMMY_RUDRAKSHA);
    console.log(`Created dummy product: ${DUMMY_RUDRAKSHA.name} (${DUMMY_RUDRAKSHA.slug})`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
