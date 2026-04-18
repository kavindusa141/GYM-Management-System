const User = require("../models/User");
const Payment = require("../models/Payment");
const GymClass = require("../models/GymClass");
const Attendance = require("../models/Attendance");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const ClassBooking = require("../models/ClassBooking");
const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutLog = require("../models/WorkoutLog");
const MemberProfile = require("../models/MemberProfile");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// ADMIN: Get Live Business Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Members (Registered Accounts) - Exclude deleted members
    const totalMembers = await User.count({ where: { role: "MEMBER", is_deleted: false } });

    // 2. Total Trainers - Exclude deleted trainers, ensure they are active
    const totalTrainers = await User.count({ where: { role: "TRAINER", is_deleted: false, status: true } });

    // 3. Total Revenue (All verified/completed payments)
    const totalRevenue = await Payment.sum("amount", {
      where: {
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }
      }
    }) || 0;

    // 4. Total Scheduled Classes
    const totalClasses = await GymClass.count({ where: { status: 'SCHEDULED' } });

    // 5. Live Members
    const liveMembersCount = await Attendance.count({ where: { status: 'PRESENT' } });

    res.json({
      totalMembers,
      totalTrainers,
      totalRevenue: Math.round(totalRevenue),
      totalClasses,
      liveMembersCount
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
      const bookings = await ClassBooking.findAll({
        where: { user_id: memberId, status: "CONFIRMED" },
        include: [{ 
          model: GymClass, 
          required: true, 
          where: { status: { [Op.ne]: 'COMPLETED' } } 
        }]
      });

      const now = new Date();
      upcomingClasses = bookings.filter(b => {
        if (!b.GymClass) return false;
        
        const dateStr = typeof b.GymClass.class_date === 'string'
          ? b.GymClass.class_date
          : new Date(b.GymClass.class_date).toISOString().split('T')[0];
          
        const endTimeStr = typeof b.GymClass.end_time === 'string'
          ? b.GymClass.end_time
          : b.GymClass.end_time?.toString?.() || '00:00:00';
          
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);
        return classEnd >= now;
      }).length;
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
    const liveMembersCount = await Attendance.count({ where: { status: 'PRESENT' } });

    // 8️⃣ Profile Completeness Check
    const profile = await MemberProfile.findOne({ where: { user_id: memberId } });
    const isProfileComplete = !!profile;

    // 9️⃣ Check for rejected payment
    const rejectedPayment = await Payment.findOne({
      where: { user_id: memberId, status: 'FAILED' },
      order: [['transaction_date', 'DESC']]
    });

    // 🔟 Check for delayed classes booked by this member
    let delayedClassDetails = null;
    try {
      const bookingsWithDelay = await ClassBooking.findAll({
        where: { user_id: memberId, status: "CONFIRMED" },
        include: [{
          model: GymClass,
          required: true,
          where: {
            status: 'SCHEDULED',
            delayed_start_time: { [Op.ne]: null }
          }
        }]
      });

      const now = new Date();
      for (const b of bookingsWithDelay) {
        if (!b.GymClass) continue;
        const dateStr = typeof b.GymClass.class_date === 'string'
          ? b.GymClass.class_date
          : new Date(b.GymClass.class_date).toISOString().split('T')[0];
        
        const endTimeStr = typeof b.GymClass.end_time === 'string'
          ? b.GymClass.end_time
          : b.GymClass.end_time?.toString?.() || '00:00:00';
          
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);
        
        // Only show if the class hasn't ended yet
        if (classEnd >= now) {
          delayedClassDetails = {
            title: b.GymClass.title,
            original_time: b.GymClass.start_time.substring(0, 5),
            delayed_time: b.GymClass.delayed_start_time.substring(0, 5),
            reason: b.GymClass.delay_reason
          };
          break; // Just show the first delayed class for simplicity
        }
      }
    } catch (e) {
      console.error("Failed to fetch delayed classes", e);
    }

    // 1️⃣1️⃣ Check for deleted classes booked by this member
    let deletedClassDetails = null;
    try {
      const bookingsWithDeleted = await ClassBooking.findAll({
        where: { user_id: memberId, status: "CONFIRMED" },
        include: [{
          model: GymClass,
          required: true,
          where: {
            is_deleted: true
          }
        }]
      });

      const now = new Date();
      for (const b of bookingsWithDeleted) {
        if (!b.GymClass) continue;
        const dateStr = typeof b.GymClass.class_date === 'string'
          ? b.GymClass.class_date
          : new Date(b.GymClass.class_date).toISOString().split('T')[0];
        
        const endTimeStr = typeof b.GymClass.end_time === 'string'
          ? b.GymClass.end_time
          : b.GymClass.end_time?.toString?.() || '00:00:00';
          
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);
        
        // Show if the class date is today or in the future
        if (classEnd >= now) {
          deletedClassDetails = {
            title: b.GymClass.title,
            original_time: b.GymClass.start_time.substring(0, 5),
            date: b.GymClass.class_date,
            reason: b.GymClass.delay_reason || "Class was cancelled and removed."
          };
          break;
        }
      }
    } catch (e) {
      console.error("Failed to fetch deleted classes", e);
    }

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
      upcomingClasses,
      liveMembersCount,
      isProfileComplete,
      delayedClassDetails,
      deletedClassDetails,
      rejectedPayment: rejectedPayment ? {
        payment_id: rejectedPayment.payment_id,
        reason: rejectedPayment.rejection_reason,
        amount: rejectedPayment.amount
      } : null
    });

  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};



// NEW: Get Trainer Dashboard Stats
exports.getTrainerDashboardStats = async (req, res) => {
  try {
    const trainerId = req.user.id;
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // 1. Count Active Plans (Clients)
    const activePlans = await WorkoutPlan.count({
      where: { trainer_id: trainerId, status: 'ACTIVE' },
      include: [{
        model: User,
        as: 'Member',
        where: { is_deleted: false }
      }]
    });

    // 2. Count Today's Classes
    const todayClassesCount = await GymClass.count({
      where: {
        trainer_id: trainerId,
        status: 'SCHEDULED'
        // Note: In a real DB, you'd filter by date here if your GymClass has a specific date. 
        // Since GymClass uses 'day_of_week', we filter by Day Name:
      }
      // logic for day checking is complex in SQL generic, keeping simple count for now or filtering in JS
    });

    // 3. Get Today's Schedule (Actual Data)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const todayName = days[new Date().getDay()];

    const todaysSchedule = await GymClass.findAll({
      where: {
        trainer_id: trainerId,
        day_of_week: todayName
      },
      order: [['start_time', 'ASC']]
    });

    // 4. Recent Client Logs (Last 5 logs from plans assigned by this trainer)
    // First get plan IDs created by this trainer
    const myPlanIds = (await WorkoutPlan.findAll({
      where: { trainer_id: trainerId },
      attributes: ['plan_id']
    })).map(p => p.plan_id);

    const recentLogs = await WorkoutLog.findAll({
      where: { plan_id: { [Op.in]: myPlanIds } },
      include: [
        { model: User, as: 'Member', attributes: ['name'] },
        { model: WorkoutPlan, as: 'Plan', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 5
    });

    const liveMembersCount = await Attendance.count({ where: { status: 'PRESENT' } });

    res.json({
      activeClients: activePlans,
      todayClassCount: todaysSchedule.length, // More accurate based on day name
      todaysSchedule,
      recentLogs,
      liveMembersCount
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// STAFF: Get Front Desk Stats
exports.getStaffDashboardStats = async (req, res) => {
  try {
    // 1. Get Today's Date string (YYYY-MM-DD) for DATEONLY column
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. Setup Date Ranges for datetime columns (like Payment.transaction_date)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // 3. Total Active Members
    const totalMembers = await User.count({
      where: { role: 'MEMBER', is_deleted: false }
    });

    // 4. Today's Check-ins 
    // FIXED: Use 'attendance_date' (DATEONLY) matches string 'YYYY-MM-DD'
    const todayAttendance = await Attendance.count({
      where: {
        attendance_date: todayStr
      }
    });

    // 5. Today's Revenue (POS + Online)
    // Payments use 'transaction_date' (DATETIME), so [Op.between] works here
    const todayRevenue = await Payment.sum('amount', {
      where: {
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] },
        transaction_date: { [Op.between]: [startOfDay, endOfDay] }
      }
    }) || 0;

    // 6. Recent Check-ins
    // FIXED: Order by 'attendance_date' then 'check_in' (TIME)
    const recentCheckins = await Attendance.findAll({
      limit: 5,
      order: [
        ['attendance_date', 'DESC'],
        ['check_in', 'DESC']
      ],
      include: [{
        model: User,
        attributes: ['name', 'member_code', 'email']
      }]
    });

    const liveMembersCount = await Attendance.count({ where: { status: 'PRESENT' } });

    res.json({
      totalMembers,
      todayAttendance,
      todayRevenue: Math.round(todayRevenue),
      recentCheckins,
      liveMembersCount
    });

  } catch (err) {
    console.error("Staff Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};