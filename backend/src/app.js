const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ===============================
// IMPORT MODELS (FOR ASSOCIATIONS)
// ===============================
const User = require("./models/User");
const MemberProfile = require("./models/MemberProfile");
const UserSubscription = require("./models/UserSubscription");
const Payment = require("./models/Payment");
const MembershipPlan = require("./models/MembershipPlan");
const Attendance = require("./models/Attendance");
const MemberAssignment = require("./models/MemberAssignment");
const ProgressLog = require("./models/ProgressLog");

// Associations are now centralized in ./models/associations.js
// require("./models/associations") is called in server.js

// User ↔ Member Assignments
// User ↔ Member Assignments and Progress Logs are now handled in associations.js

// ===============================
// IMPORT ROUTES
// ===============================
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const memberRoutes = require("./routes/member.routes");
const classRoutes = require("./routes/class.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const paymentRoutes = require("./routes/payment.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const workoutRoutes = require("./routes/workout.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const bookingRoutes = require("./routes/booking.routes");
const membershipRoutes = require("./routes/membership.routes");
const settingsRoutes = require("./routes/settings.routes");
const availabilityRoutes = require("./routes/availability.routes");
const assignmentRoutes = require("./routes/assignment.routes");
const progressRoutes = require("./routes/progress.routes");


// ===============================
// APP INITIALIZATION
// ===============================
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ===============================
// ROUTE REGISTRATION
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/progress", progressRoutes);

// Dashboard routes (shared but role-protected internally)
app.use("/api/admin", dashboardRoutes);
app.use("/api/member", dashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ===============================
// STATIC FILE SERVING (CRITICAL)
// ===============================
app.use("/uploads", express.static("uploads"));

// ===============================
// ROOT TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("Gym Management API running");
});

module.exports = app;
