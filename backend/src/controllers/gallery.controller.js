const { Gallery } = require("../models/associations");
const fs = require('fs');
const path = require('path');

// @desc    Get all gallery images
// @route   GET /api/gallery
// @access  Public
exports.getGalleryImages = async (req, res) => {
    try {
        const images = await Gallery.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json(images);
    } catch (error) {
        console.error("Error fetching gallery images:", error);
        res.status(500).json({ message: "Failed to fetch gallery images" });
    }
};

// @desc    Upload new gallery image
// @route   POST /api/gallery
// @access  Private (Admin only)
exports.uploadGalleryImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        // With multer-storage-cloudinary, req.file.path is the remote Cloudinary URL
        const imageUrl = req.file.path;

        const newImage = await Gallery.create({
            image_url: imageUrl
        });

        res.status(201).json({
            message: "Image uploaded successfully",
            image: newImage
        });
    } catch (error) {
        console.error("Error uploading gallery image:", error);
        // clean up the uploaded file if db insertion fails
        if (req.file && req.file.filename) {
            const cloudinary = require("../config/cloudinary");
            cloudinary.uploader.destroy(req.file.filename).catch(err => console.error("Cloudinary cleanup error:", err));
        }
        res.status(500).json({ message: "Failed to upload image" });
    }
};

// @desc    Delete gallery image
// @route   DELETE /api/gallery/:id
// @access  Private (Admin only)
exports.deleteGalleryImage = async (req, res) => {
    try {
        const imageId = req.params.id;
        const image = await Gallery.findByPk(imageId);

        if (!image) {
            return res.status(404).json({ message: "Image not found" });
        }

        // Try to remove file from Cloudinary or local depending on format
        if (image.image_url.includes('res.cloudinary.com')) {
            const cloudinary = require("../config/cloudinary");
            // extract public_id
            const parts = image.image_url.split('/');
            const lastPart = parts.pop(); // filename.ext
            const folderName = parts.pop(); // gym_gallery
            const publicId = `${folderName}/${lastPart.split('.')[0]}`;

            await cloudinary.uploader.destroy(publicId);
        } else {
            const filename = image.image_url.replace('/uploads/', '');
            const filepath = path.join(__dirname, '..', '..', 'uploads', filename);

            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        }

        // Remove from DB
        await image.destroy();

        res.status(200).json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting gallery image:", error);
        res.status(500).json({ message: "Failed to delete image" });
    }
};
