const express = require("express");
const router = express.Router();
const { 
  createPlan, 
  getTrainerPlans, 
  getMembersForTrainer, 
  getMyPlans,
  logWorkout, 
  getClientProgress 
} = require("../controllers/workout.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// TRAINER ROUTES
router.post("/", verifyToken, allowRoles("TRAINER", "ADMIN"), createPlan);
router.get("/created", verifyToken, allowRoles("TRAINER", "ADMIN"), getTrainerPlans);
router.get("/members", verifyToken, allowRoles("TRAINER", "ADMIN"), getMembersForTrainer);

// MEMBER ROUTES
router.get("/my-plans", verifyToken, allowRoles("MEMBER"), getMyPlans);

// NEW: Member logs a workout
router.post("/log", verifyToken, allowRoles("MEMBER"), logWorkout);

// NEW: Trainer views specific client progress
router.get("/progress/:member_id", verifyToken, allowRoles("TRAINER", "ADMIN"), getClientProgress);

module.exports = router;