const express = require("express");
const router = express.Router();
const { 
  createPayment, 
  getAllPayments, 
  verifyPayment 
} = require("../controllers/payment.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// --- MULTER SETUP ---
const multer = require("multer");
const path = require("path");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, "slip-" + Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// --- ROUTES ---

// 1. Admin Pay (Cash) AND Member Pay (Card/Transfer)
// This single route handles both because the Controller logic checks the Role
router.post("/admin-pay", verifyToken, allowRoles("ADMIN"), upload.single("slip_image"), createPayment);
router.post("/pay", verifyToken, allowRoles("MEMBER"), upload.single("slip_image"), createPayment);

// 2. Verify Payment
router.post("/verify/:payment_id", verifyToken, allowRoles("ADMIN"), verifyPayment);

// 3. Get History
router.get("/", verifyToken, getAllPayments);

module.exports = router;