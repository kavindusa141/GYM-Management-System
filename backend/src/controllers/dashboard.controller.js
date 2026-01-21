const User = require("../models/User");
const Payment = require("../models/Payment");
const GymClass = require("../models/GymClass");
const Attendance = require("../models/Attendance");
const UserSubscription = require("../models/UserSubscription"); // <--- NEW (3NF)
const ClassBooking = require("../models/ClassBooking"); // Use if available, else optional
const { Op } = require("sequelize");

// ADMIN: Get Live Business Stats
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Members (Registered Accounts)
    const totalMembers = await User.count({ where: { role: "MEMBER" } });

    // 2. Active Members (Paying Customers with Valid Subscriptions)
    // This is the "Real" count of current customers
    const activeMembers = await UserSubscription.count({
      where: {
        status: 'ACTIVE',
        end_date: { [Op.gte]: new Date() } // Expiry date must be in future
      }
    });

    // 3. Monthly Revenue (Only Verified/Completed Payments this month)
    const startOfMonth = new Date();
    startOfMonth.setDate(1); // Set to 1st of current month
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Payment.sum("amount", {
      where: {
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }, // Ignore Pending/Failed
        transaction_date: { [Op.gte]: startOfMonth }
      }
    }) || 0;

    // 4. Today's Foot Traffic (Attendance)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayAttendance = await Attendance.count({
      where: {
        attendance_date: { [Op.gte]: startOfToday }
      }
    });

    res.json({
      totalMembers,
      activeMembers,
      monthlyRevenue,
      todayAttendance
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

// MEMBER: Personal Dashboard Stats
exports.getMemberStats = async (req, res) => {
  try {
    const memberId = req.user.id;

    // 1. Attendance Count
    const attendanceCount = await Attendance.count({ where: { user_id: memberId } });

    // 2. Subscription Status
    const subscription = await UserSubscription.findOne({
      where: { user_id: memberId, status: 'ACTIVE' },
      order: [['end_date', 'DESC']]
    });

    // 3. Upcoming Bookings (If ClassBooking exists)
    let upcomingClasses = 0;
    try {
        upcomingClasses = await ClassBooking.count({
            where: { 
                user_id: memberId,
                status: 'CONFIRMED'
            },
            include: [{
                model: GymClass,
                where: { schedule_time: { [Op.gte]: new Date() } }
            }]
        });
    } catch (e) {
        // Fallback if ClassBooking table isn't fully set up yet
        upcomingClasses = 0;
    }

    res.json({
      attendanceCount,
      upcomingClasses,
      active: !!subscription, // True if subscription exists
      planName: subscription ? "Active Member" : "No Active Plan",
      expiryDate: subscription ? subscription.end_date : null
    });

  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};


// MEMBER: Personal Dashboard Stats
exports.getMemberStats = async (req, res) => {
  try {
    const memberId = req.user.id;

    // 1. Attendance Count
    const attendanceCount = await Attendance.count({ where: { user_id: memberId } });

    // 2. Subscription Status (Fetch the latest ACTIVE one)
    const subscription = await UserSubscription.findOne({
      where: { 
        user_id: memberId, 
        status: 'ACTIVE',
        end_date: { [Op.gte]: new Date() } // Must not be expired
      },
      include: [{ model: MembershipPlan, attributes: ['name'] }], // <--- Get Plan Name
      order: [['end_date', 'DESC']]
    });

    // 3. Calculate Days Remaining
    let daysLeft = 0;
    if (subscription) {
      const today = new Date();
      const end = new Date(subscription.end_date);
      const diffTime = Math.abs(end - today);
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    }

    res.json({
      attendanceCount,
      active: !!subscription, 
      planName: subscription ? subscription.MembershipPlan.name : "No Active Plan",
      expiryDate: subscription ? subscription.end_date : null,
      daysLeft: daysLeft,
      startDate: subscription ? subscription.start_date : null
    });

  } catch (err) {
    console.error("Member Stats Error:", err);
    res.status(500).json({ error: err.message });
  }
};