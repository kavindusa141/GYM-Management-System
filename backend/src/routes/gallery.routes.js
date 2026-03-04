const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
    getGalleryImages,
    uploadGalleryImage,
    deleteGalleryImage
} = require("../controllers/gallery.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// --- MULTER SETUP (CLOUDINARY) ---
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "gym_gallery", // The folder in cloudinary
        allowed_formats: ["jpg", "png", "jpeg", "webp"]
    }
});

// Configure multer with storage and file filter
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});

// ===============================
// PUBLIC ROUTES
// ===============================
// GET all images for the landing page
router.get("/", getGalleryImages);

// ===============================
// PROTECTED ROUTES (ADMIN ONLY)
// ===============================
// UPLOAD an image
router.post(
    "/",
    verifyToken,
    allowRoles("ADMIN"),
    upload.single("image"), // expects form-data key "image"
    uploadGalleryImage
);

// DELETE an image
router.delete(
    "/:id",
    verifyToken,
    allowRoles("ADMIN"),
    deleteGalleryImage
);

module.exports = router;
