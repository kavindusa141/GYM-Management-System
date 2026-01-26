const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Import controller functions
const { 
  getDashboardStats, 
  getAnalytics 
} = require("../controllers/dashboard.controller");



const { 
  getAllMembers, 
  addMember, 
  deleteMember,
  getDeletedMembers,
  getDeletedMemberPaymentHistory,
  getDeletedMemberSubscriptionHistory,
  getDeletedMemberAttendanceHistory,
  getEmployees, 
  createEmployee, 
  getAllTrainers,
  deleteEmployee
 
} = require("../controllers/admin.controller"); 

const { getReportsData } = require("../controllers/reports.controller");

// --- DASHBOARD ROUTES ---
router.get("/dashboard", verifyToken, allowRoles("ADMIN"), getDashboardStats);
router.get("/analytics", verifyToken, allowRoles("ADMIN"), getAnalytics);

// --- MEMBER MANAGEMENT ROUTES ---
// 1. List all ACTIVE members
router.get("/members", verifyToken, allowRoles("ADMIN", "STAFF"), getAllMembers);

// 2. Add a new member (Admin manual add)
router.post("/members", verifyToken, allowRoles("ADMIN", "STAFF"), addMember);

// 3. Delete (Soft Delete) a member
router.delete("/members/:id", verifyToken, allowRoles("ADMIN", "STAFF"), deleteMember);

// 4. Get all DELETED members (for reporting and analysis)
router.get("/deleted-members", verifyToken, allowRoles("ADMIN"), getDeletedMembers);

// 5. Reporting Routes for Deleted Members
router.get("/deleted-members/:id/payments", verifyToken, allowRoles("ADMIN"), getDeletedMemberPaymentHistory);
router.get("/deleted-members/:id/subscriptions", verifyToken, allowRoles("ADMIN"), getDeletedMemberSubscriptionHistory);
router.get("/deleted-members/:id/attendance", verifyToken, allowRoles("ADMIN"), getDeletedMemberAttendanceHistory);

// --- EMPLOYEES (STAFF & TRAINERS) ---
router.get("/employees", verifyToken, allowRoles("ADMIN"), getEmployees);
router.post("/employees", verifyToken, allowRoles("ADMIN"), createEmployee);
router.get("/trainers", verifyToken, allowRoles("ADMIN", "STAFF"), getAllTrainers);

// NEW ROUTE: Delete Staff/Trainer
// This matches the frontend call: api.delete(`/admin/users/${id}`)
router.delete("/users/:id", verifyToken, allowRoles("ADMIN"), deleteEmployee);

// --- REPORTS ---
router.get("/reports", verifyToken, allowRoles("ADMIN", "STAFF"), getReportsData);




module.exports = router;