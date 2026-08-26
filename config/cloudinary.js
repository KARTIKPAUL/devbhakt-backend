import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
console.log("API Key:", process.env.CLOUDINARY_API_KEY);
console.log(
  "API Secret:",
  process.env.CLOUDINARY_API_SECRET ? "Loaded" : "Missing",
);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "kartikeyo-photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    // No `transformation` here — that's what was force-shrinking every
    // upload to 400x400 before it was even saved, permanently destroying
    // detail no matter how the image was displayed afterwards.
    //
    // Cap at a generous max instead (product photography rarely needs to
    // exceed ~2000px on the long edge for web use), so huge camera-original
    // files don't bloat storage, without wrecking normal photos:
    transformation: [
      {
        width: 2000,
        height: 2000,
        crop: "limit", // only shrinks images LARGER than 2000x2000, never upscales or crops
        quality: "auto:best",
      },
    ],
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
});
