const express = require("express");
const router = express.Router();
const { 
  createPlan, 
  getTrainerPlans, 
  getMembersForTrainer, 
  getMyPlans,
  logWorkout, 
  getClientProgress,
  getPlanById, 
  updatePlan,
  deletePlan 
} = require("../controllers/workout.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// =================================================================
// 1. SPECIFIC ROUTES (Define these FIRST)
// =================================================================

// TRAINER: Get List of Created Plans
router.get("/created", verifyToken, allowRoles("TRAINER", "ADMIN"), getTrainerPlans);
router.get("/trainer/my-plans", verifyToken, allowRoles("TRAINER"), getTrainerPlans);

// TRAINER: Get Members for Dropdown
router.get("/members", verifyToken, allowRoles("TRAINER", "ADMIN"), getMembersForTrainer);

// MEMBER: Get My Assigned Plans
// ✅ MOVED UP: Must be before /:id to prevent conflict
router.get("/my-plans", verifyToken, allowRoles("MEMBER"), getMyPlans);

// MEMBER: Log a Workout
router.post("/log", verifyToken, allowRoles("MEMBER"), logWorkout);

// TRAINER: View Client Progress
router.get("/progress/:member_id", verifyToken, allowRoles("TRAINER", "ADMIN"), getClientProgress);

// =================================================================
// 2. ROOT ROUTES
// =================================================================

// Create New Plan
router.post("/", verifyToken, allowRoles("TRAINER", "ADMIN"), createPlan);

// =================================================================
// 3. DYNAMIC ROUTES (Define these LAST)
// =================================================================

// Get Single Plan by ID (This catches anything looking like /123)
router.get("/:id", verifyToken, allowRoles("TRAINER", "ADMIN"), getPlanById);

// Update Plan
router.put("/:id", verifyToken, allowRoles("TRAINER"), updatePlan);

// Delete Plan
router.delete("/:id", verifyToken, allowRoles("TRAINER"), deletePlan);

module.exports = router;