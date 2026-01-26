const express = require("express");
const router = express.Router();
const { 
  getDashboardStats, 
  getAnalytics, 
  getMemberStats,
  getTrainerDashboardStats,
  getStaffDashboardStats 
} = require("../controllers/dashboard.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// ADMIN: Overview Stats
router.get("/stats", verifyToken, allowRoles("ADMIN"), getDashboardStats);

// ADMIN: Charts & Analytics
router.get("/analytics", verifyToken, allowRoles("ADMIN"), getAnalytics);

// MEMBER: Personal Dashboard Stats 
router.get("/member-stats", verifyToken, allowRoles("MEMBER"), getMemberStats);

// Trainer
router.get("/trainer-stats", verifyToken, allowRoles("TRAINER"), getTrainerDashboardStats);

// STAFF: Dashboard Stats (NEW)
router.get("/staff-stats", verifyToken, allowRoles("STAFF", "ADMIN"), getStaffDashboardStats);

module.exports = router;