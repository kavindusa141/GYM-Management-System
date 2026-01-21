const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Import controller functions
const { getDashboardStats, getAnalytics } = require("../controllers/dashboard.controller");
const { getAllMembers, addMember, deleteUser,getEmployees, createEmployee, getAllTrainers } = require("../controllers/admin.controller"); 
const { getReportsData } = require("../controllers/reports.controller");

// --- DASHBOARD ROUTES ---
router.get("/dashboard", verifyToken, allowRoles("ADMIN"), getDashboardStats);
router.get("/analytics", verifyToken, allowRoles("ADMIN"), getAnalytics);

// --- MEMBER MANAGEMENT ROUTES ---
// 1. List all members
router.get("/members", verifyToken, allowRoles("ADMIN"), getAllMembers);

// 2. Add a new member (Admin manual add)
router.post("/members", verifyToken, allowRoles("ADMIN"), addMember); // <--- NEW ROUTE

// 3. Delete a member
router.delete("/users/:id", verifyToken, allowRoles("ADMIN"), deleteUser);


// Employees (Staff & Trainers Management) - NEW ROUTES
router.get("/employees", verifyToken, allowRoles("ADMIN"), getEmployees);
router.post("/employees", verifyToken, allowRoles("ADMIN"), createEmployee);

router.get("/trainers", verifyToken, allowRoles("ADMIN"), getAllTrainers);

router.get("/reports", verifyToken, allowRoles("ADMIN"), getReportsData);

module.exports = router;