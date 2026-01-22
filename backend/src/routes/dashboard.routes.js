const express = require("express");
const router = express.Router();
const { 
  getDashboardStats, 
  getAnalytics, 
  getMemberStats 
} = require("../controllers/dashboard.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// ADMIN: Overview Stats
router.get("/stats", verifyToken, allowRoles("ADMIN"), getDashboardStats);

// ADMIN: Charts & Analytics
router.get("/analytics", verifyToken, allowRoles("ADMIN"), getAnalytics);

// MEMBER: Personal Dashboard Stats 
router.get("/member-stats", verifyToken, allowRoles("MEMBER"), getMemberStats);

module.exports = router;