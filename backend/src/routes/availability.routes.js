const express = require("express");
const router = express.Router();
const { getAvailability, updateAvailability, getTrainerAvailabilityById } = require("../controllers/availability.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Get Schedule
router.get("/", verifyToken, allowRoles("TRAINER"), getAvailability);

// Save Schedule
router.post("/", verifyToken, allowRoles("TRAINER"), updateAvailability);

// Get Specific Trainer Schedule (Admin/Staff/Member)
router.get("/:trainerId", verifyToken, getTrainerAvailabilityById);

module.exports = router;