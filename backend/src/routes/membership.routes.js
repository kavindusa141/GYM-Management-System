const express = require("express");
const router = express.Router();
const { 
  createPlan, 
  getAllPlans, 
  getPlanById, 
  deletePlan 
} = require("../controllers/membership.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// PUBLIC ROUTES (Or Authenticated Members)
// Anyone logged in can view available plans
router.get("/", verifyToken, getAllPlans); 
router.get("/:id", verifyToken, getPlanById);

// ADMIN ROUTES
// Only Admins can manage the catalogue
router.post("/", verifyToken, allowRoles("ADMIN"), createPlan);
router.delete("/:id", verifyToken, allowRoles("ADMIN"), deletePlan);

module.exports = router;