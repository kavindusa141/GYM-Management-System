const express = require("express");
const router = express.Router();
const { getAvailability, updateAvailability } = require("../controllers/availability.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Get Schedule
router.get("/", verifyToken, allowRoles("TRAINER"), getAvailability);

// Save Schedule
router.post("/", verifyToken, allowRoles("TRAINER"), updateAvailability);

module.exports = router;