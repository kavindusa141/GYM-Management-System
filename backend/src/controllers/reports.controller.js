const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Payment = require("../models/Payment");
const Attendance = require("../models/Attendance");
const MembershipPlan = require("../models/MembershipPlan");
const UserSubscription = require("../models/UserSubscription"); // Correct Import

// Helper to format dates YYYY-MM
const getMonthYear = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

exports.getReportsData = async (req, res) => {
  // Initialize default empty structure so frontend doesn't crash
  const responseData = { financial: [], attendance: [], membership: [] };

  try {
    // ==========================================
    // 1. FINANCIAL REPORT (JS Aggregation)
    // ==========================================
    try {
      // Fetch raw payments for last 6 months
      const payments = await Payment.findAll({
        where: {
          transaction_date: { [Op.gte]: new Date(new Date() - 180 * 24 * 60 * 60 * 1000) }
        },
        attributes: ['amount', 'transaction_date'],
        raw: true
      });

      // Group by Month in Javascript
      const financialMap = {};
      payments.forEach(p => {
        const month = getMonthYear(p.transaction_date);
        if (!financialMap[month]) financialMap[month] = { total_revenue: 0, transaction_count: 0 };
        financialMap[month].total_revenue += parseFloat(p.amount);
        financialMap[month].transaction_count += 1;
      });

      // Convert to Array for Recharts
      responseData.financial = Object.keys(financialMap).sort().map(month => ({
        month,
        total_revenue: financialMap[month].total_revenue,
        transaction_count: financialMap[month].transaction_count
      }));

    } catch (finError) {
      console.error("Financial Report Error:", finError.message);
    }

    // ==========================================
    // 2. ATTENDANCE REPORT (JS Aggregation)
    // ==========================================
    try {
      // Fetch raw attendance for last 7 days
      const attendance = await Attendance.findAll({
        where: {
          attendance_date: { [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
        },
        attributes: ['attendance_date'],
        raw: true
      });

      // Group by Date in Javascript
      const attMap = {};
      attendance.forEach(a => {
        const date = a.attendance_date; 
        if (!attMap[date]) attMap[date] = 0;
        attMap[date] += 1;
      });

      responseData.attendance = Object.keys(attMap).sort().map(date => ({
        date,
        count: attMap[date]
      }));

    } catch (attError) {
      console.error("Attendance Report Error:", attError.message);
    }

    // ==========================================
    // 3. MEMBERSHIP REPORT (Count Plans)
    // ==========================================
    try {
      // FIX: Use UserSubscription instead of UserMembership
      const memberships = await UserSubscription.findAll({
        where: { status: 'ACTIVE' },
        attributes: ['plan_id'], // Ensure your DB has plan_id column or update this key
        raw: true
      });

      // Get plan names
      const plans = await MembershipPlan.findAll({ raw: true });
      const planLookup = {};
      plans.forEach(p => {
        planLookup[p.plan_id] = p.name;
      });

      // Count members per plan
      const memMap = {};
      memberships.forEach(m => {
        const planName = planLookup[m.plan_id] || "Unknown Plan";
        if (!memMap[planName]) memMap[planName] = 0;
        memMap[planName] += 1;
      });

      responseData.membership = Object.keys(memMap).map(name => ({
        plan_name: name,
        member_count: memMap[name]
      }));

    } catch (memError) {
      console.error("Membership Report Error:", memError.message);
    }

    // Send collected data
    res.json(responseData);

  } catch (err) {
    console.error("General Reports Error:", err);
    res.status(500).json({ error: "Failed to generate reports" });
  }
};