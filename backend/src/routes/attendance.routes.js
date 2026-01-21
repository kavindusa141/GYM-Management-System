const express = require("express");
const router = express.Router();
const { 
  markAttendance, 
  getTodayAttendance, 
  getDailyQRPayload,
  getMyAttendance,
  markAttendanceByQR // <--- Import this
} = require("../controllers/attendance.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Admin Routes
router.post("/checkin", verifyToken, allowRoles("ADMIN", "STAFF"), markAttendance);
router.get("/qr-generate", verifyToken, allowRoles("ADMIN", "STAFF"), getDailyQRPayload);
router.get("/today", verifyToken, allowRoles("ADMIN", "STAFF"), getTodayAttendance);

// Member Routes
router.get("/my-history", verifyToken, allowRoles("MEMBER"), getMyAttendance);

// NEW: QR Scan Route
router.post("/qr-scan", verifyToken, allowRoles("MEMBER"), markAttendanceByQR);

module.exports = router;