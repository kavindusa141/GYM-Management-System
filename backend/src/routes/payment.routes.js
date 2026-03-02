const express = require("express");
const router = express.Router();
const {
  createPayment,
  getAllPayments,
  verifyPayment,
  getPaymentReceipt,
  downloadReceiptPDF,
  reuploadSlip // <--- Added new controller function
} = require("../controllers/payment.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// --- MULTER SETUP ---
// --- MULTER SETUP (CLOUDINARY) ---
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gym_slips", // The folder in cloudinary
    allowed_formats: ["jpg", "png", "jpeg", "webp", "pdf"]
  }
});

const upload = multer({ storage });

// ===============================
// ROUTES
// ===============================

// ✅ MEMBER uploads bank slip
router.post(
  "/pay",
  verifyToken,
  allowRoles("MEMBER"),
  upload.any(),
  createPayment
);

// ✅ MEMBER re-uploads bank slip for rejected payment (NEW)
router.post(
  "/reupload/:payment_id",
  verifyToken,
  allowRoles("MEMBER"),
  upload.single("slip_image"),
  reuploadSlip
);

// ✅ ADMIN creates payment (cash OR transfer)
router.post(
  "/admin-pay",
  verifyToken,
  allowRoles("ADMIN", "STAFF"),
  upload.any(),
  createPayment
);

// ✅ ADMIN verifies payment
router.post(
  "/verify/:payment_id",
  verifyToken,
  allowRoles("ADMIN"),
  verifyPayment
);

// ✅ BOTH roles can view history
router.get(
  "/",
  verifyToken,
  getAllPayments
);

router.get(
  "/receipt/:payment_id",
  verifyToken,
  getPaymentReceipt
);

// ✅ DOWNLOAD RECEIPT AS PDF
router.get(
  "/receipt/:payment_id/download-pdf",
  verifyToken,
  downloadReceiptPDF
);

module.exports = router;