const User = require("../models/User");
const Payment = require("../models/Payment");
const GymClass = require("../models/GymClass");
const Attendance = require("../models/Attendance");
const UserSubscription = require("../models/UserSubscription"); // <--- NEW (3NF)
const MembershipPlan = require("../models/MembershipPlan");
const ClassBooking = require("../models/ClassBooking"); // Use if available, else optional
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// ADMIN: Get Live Business Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Members (Registered Accounts) - Exclude deleted members
    const totalMembers = await User.count({ where: { role: "MEMBER", is_deleted: false } });

    // 2. Total Trainers - Exclude deleted trainers
    const totalTrainers = await User.count({ where: { role: "TRAINER", is_deleted: false } });

    // 3. Total Revenue (All verified/completed payments)
    const totalRevenue = await Payment.sum("amount", {
      where: {
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }
      }
    }) || 0;

    // 4. Total Classes
    const totalClasses = await GymClass.count();

    res.json({
      totalMembers,
      totalTrainers,
      totalRevenue: Math.round(totalRevenue),
      totalClasses
    });

  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ADMIN: Get Detailed Analytics (Charts)
exports.getAnalytics = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Revenue Chart (Last 6 Months)
    const rawPayments = await Payment.findAll({
      attributes: ['amount', 'transaction_date'],
      where: {
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }, // Only real money
        transaction_date: { [Op.gte]: sixMonthsAgo }
      },
      order: [['transaction_date', 'ASC']]
    });

    // 2. Member Growth Chart
    const rawMembers = await User.findAll({
      attributes: ['created_at'],
      where: {
        role: 'MEMBER',
        is_deleted: false,
        created_at: { [Op.gte]: sixMonthsAgo }
      },
      order: [['created_at', 'ASC']]
    });

    // Helper: Group Data by Month
    const processMonthly = (data, dateKey, valueKey = null) => {
      const grouped = {};
      
      // Initialize last 6 months with 0 to prevent gaps in chart
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        grouped[monthName] = 0;
      }

      data.forEach(item => {
        const dateVal = item[dateKey] || item.dataValues[dateKey];
        if (!dateVal) return;
        
        const month = new Date(dateVal).toLocaleString('default', { month: 'short' });
        if (grouped[month] !== undefined) {
          grouped[month] += valueKey ? parseFloat(item[valueKey]) : 1;
        }
      });

      return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
    };

    const revenueData = processMonthly(rawPayments, 'transaction_date', 'amount');
    const memberData = processMonthly(rawMembers, 'created_at');

    res.json({ revenueData, memberData });

  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ error: err.message });
  }
};



/* ================================
   MEMBER: Personal Dashboard Stats
================================ */
exports.getMemberStats = async (req, res) => {
  try {
    // Get user ID from token/session
    const memberId = req.user.user_id || req.user.id;

    // 1️⃣ Attendance Count
    const attendanceCount = await Attendance.count({
      where: { member_id: memberId }
    });

    // --- NEW: Calculate Average Duration ---
    // We only average sessions where 'duration' is not null (meaning they checked out)
    const durationStats = await Attendance.findAll({
      where: { 
        member_id: memberId,
        duration: { [Op.ne]: null } // Only completed sessions
      },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration']
      ],
      raw: true
    });

    const avgMinutes = durationStats[0].avgDuration 
      ? Math.round(parseFloat(durationStats[0].avgDuration)) 
      : 0;

    // 2️⃣ Today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 3️⃣ Fetch only the current ACTIVE subscription
    const activeSubscription = await UserSubscription.findOne({
      where: {
        user_id: memberId,
        status: "ACTIVE",
        end_date: { [Op.gte]: today } // ensure still valid
      },
      include: [{ model: MembershipPlan, attributes: ["name"] }],
      order: [["end_date", "DESC"]]
    });

    // 4️⃣ Auto-expire subscriptions if needed
    if (activeSubscription) {
      const endDate = new Date(activeSubscription.end_date);
      endDate.setHours(0, 0, 0, 0);
      if (endDate < today && activeSubscription.status === "ACTIVE") {
        await activeSubscription.update({ status: "EXPIRED" });
      }
    }

    // 5️⃣ Upcoming classes count
    let upcomingClasses = 0;
    try {
      upcomingClasses = await ClassBooking.count({
        where: { user_id: memberId, status: "CONFIRMED" }
      });
    } catch (e) {
      upcomingClasses = 0;
    }

    // 6️⃣ Days left calculation
    let daysLeft = 0;
    if (activeSubscription) {
      const endDate = new Date(activeSubscription.end_date);
      endDate.setHours(0, 0, 0, 0);
      const diffTime = endDate.getTime() - today.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // 7️⃣ Return dashboard data
    res.json({
      attendanceCount,
      avgMinutes,
      active: !!activeSubscription,
      planName: activeSubscription
        ? activeSubscription.MembershipPlan.name
        : "No Active Plan",
      startDate: activeSubscription ? activeSubscription.start_date : null,
      expiryDate: activeSubscription ? activeSubscription.end_date : null,
      daysLeft,
      upcomingClasses
    });

  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};