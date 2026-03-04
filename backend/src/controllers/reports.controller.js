const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Payment = require("../models/Payment");
const Attendance = require("../models/Attendance");
const MembershipPlan = require("../models/MembershipPlan");
const UserSubscription = require("../models/UserSubscription");
const User = require("../models/User");
const ClassBooking = require("../models/ClassBooking");
const GymClass = require("../models/GymClass");

exports.getReportsData = async (req, res) => {
  try {
    // 1. Dynamic Date Filtering
    const { startDate, endDate } = req.query;
    // Default: Last 30 days
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    // Adjust end date to include the full day
    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    // ==========================================
    // 1. FINANCIAL REPORT
    // ==========================================
    const financialData = await Payment.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('transaction_date'), '%Y-%m-%d'), 'date'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'total_revenue'],
        [sequelize.fn('COUNT', sequelize.col('payment_id')), 'transaction_count']
      ],
      where: {
        transaction_date: { [Op.between]: [start, endOfDay] },
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('transaction_date'), '%Y-%m-%d')],
      order: [[sequelize.literal('date'), 'ASC']],
      raw: true
    });

    const paymentMethods = await Payment.findAll({
      attributes: [
        'payment_method',
        [sequelize.fn('SUM', sequelize.col('amount')), 'amount']
      ],
      where: {
        transaction_date: { [Op.between]: [start, endOfDay] },
        status: { [Op.or]: ['VERIFIED', 'COMPLETED'] }
      },
      group: ['payment_method'],
      raw: true
    });

    // ==========================================
    // 2. ATTENDANCE REPORT (Enhanced)
    // ==========================================
    // Daily Trend
    const attendanceData = await Attendance.findAll({
      attributes: [
        'attendance_date',
        [sequelize.fn('COUNT', sequelize.col('attendance_id')), 'count']
      ],
      where: {
        attendance_date: { [Op.between]: [start, end] }
      },
      group: ['attendance_date'],
      order: [['attendance_date', 'ASC']],
      raw: true
    });

    // Peak Hours (e.g., 17:00 has 50 check-ins)
    const peakHours = await Attendance.findAll({
      attributes: [
        [sequelize.fn('HOUR', sequelize.col('check_in')), 'hour'],
        [sequelize.fn('COUNT', sequelize.col('attendance_id')), 'count']
      ],
      where: {
        attendance_date: { [Op.between]: [start, end] }
      },
      group: [sequelize.fn('HOUR', sequelize.col('check_in'))],
      order: [[sequelize.literal('hour'), 'ASC']],
      raw: true
    });

    // DETAILED CHECK-IN LOGS (Member specific)
    const memberLogs = await Attendance.findAll({
      where: {
        attendance_date: { [Op.between]: [start, end] }
      },
      include: [{
        model: User,
        attributes: ['name']
      }],
      order: [
        ['attendance_date', 'DESC'],
        ['check_in', 'DESC']
      ]
    });

    // ==========================================
    // 3. MEMBERSHIP DISTRIBUTION
    // ==========================================
    const memberships = await UserSubscription.findAll({
      where: { status: 'ACTIVE' },
      attributes: [
        [sequelize.col('MembershipPlan.name'), 'plan_name'],
        [sequelize.col('MembershipPlan.price'), 'plan_price'],
        [sequelize.fn('COUNT', sequelize.col('UserSubscription.subscription_id')), 'member_count']
      ],
      include: [{
        model: MembershipPlan,
        attributes: []
      }],
      group: ['MembershipPlan.name', 'MembershipPlan.price'],
      raw: true
    });

    // ==========================================
    // 4. RETENTION & CHURN (New)
    // ==========================================

    // A. Churn Count (Cancelled/Expired in range)
    const churnCount = await UserSubscription.count({
      where: {
        status: { [Op.in]: ['CANCELLED', 'EXPIRED'] },
        end_date: { [Op.between]: [start, end] }
      }
    });

    // B. At-Risk Members (Active but no attendance in last 21 days)
    const twentyOneDaysAgo = new Date();
    twentyOneDaysAgo.setDate(twentyOneDaysAgo.getDate() - 21);

    // Get all active members
    const activeMembers = await User.findAll({
      where: { role: 'MEMBER', is_deleted: false, status: true },
      attributes: ['user_id', 'name', 'email', 'phone']
    });

    // Get members who visited in last 21 days
    const recentVisitors = await Attendance.findAll({
      attributes: ['member_id'],
      where: {
        attendance_date: { [Op.gte]: twentyOneDaysAgo }
      },
      group: ['member_id'],
      raw: true
    });
    const recentVisitorIds = new Set(recentVisitors.map(v => v.member_id));

    // Filter to find who is NOT in recent visitors
    const atRiskList = activeMembers
      .filter(m => !recentVisitorIds.has(m.user_id))
      .map(m => ({
        user_id: m.user_id,
        name: m.name,
        email: m.email,
        phone: m.phone
      }));

    // C. Expiry Forecast (Expiring in next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const todayDate = new Date();

    const expiringSoon = await UserSubscription.findAll({
      where: {
        status: 'ACTIVE',
        end_date: { [Op.between]: [todayDate, thirtyDaysFromNow] }
      },
      include: [
        { model: sequelize.models.User, attributes: ['name', 'email', 'phone'] },
        { model: MembershipPlan, attributes: ['name'] }
      ],
      order: [['end_date', 'ASC']]
    });


    res.json({
      financial: financialData.map(d => ({
        date: d.date,
        total_revenue: parseFloat(d.total_revenue),
        transaction_count: parseInt(d.transaction_count)
      })),
      payment_methods: paymentMethods.map(p => ({
        name: p.payment_method || 'Unknown',
        value: parseFloat(p.amount)
      })),
      attendance: attendanceData.map(d => ({
        date: d.attendance_date,
        count: parseInt(d.count)
      })),
      attendance_logs: memberLogs.map(log => ({
        id: log.attendance_id,
        date: log.attendance_date,
        check_in: log.check_in,
        member_name: log.User ? log.User.name : 'Unknown',
        status: log.status
      })),
      peak_hours: peakHours.map(h => ({
        hour: `${h.hour}:00`,
        count: parseInt(h.count)
      })),
      membership: memberships.map(m => ({
        plan_name: m.plan_name || 'Legacy',
        plan_price: parseFloat(m.plan_price || 0),
        member_count: parseInt(m.member_count),
        estimated_value: parseFloat(m.plan_price || 0) * parseInt(m.member_count)
      })),
      retention: {
        churn_count: churnCount,
        at_risk_count: atRiskList.length,
        at_risk_members: atRiskList,
        expiring_count: expiringSoon.length,
        expiring_members: expiringSoon.map(s => ({
          subscription_id: s.subscription_id,
          member_name: s.User?.name || 'Unknown',
          plan_name: s.MembershipPlan?.name || 'Plan',
          end_date: s.end_date,
          email: s.User?.email,
          phone: s.User?.phone
        }))
      }
    });

  } catch (err) {
    console.error("Reports Error:", err);
    res.status(500).json({ error: "Failed to generate reports" });
  }
};

exports.getMemberReportData = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const endOfDay = new Date(end);
    endOfDay.setHours(23, 59, 59, 999);

    // Verify member exists
    const member = await User.findOne({
      where: { user_id: id, role: 'MEMBER' },
      attributes: ['user_id', 'name', 'email', 'phone']
    });

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    // 1. Attendance History
    const attendanceLogs = await Attendance.findAll({
      where: {
        member_id: id,
        attendance_date: { [Op.between]: [start, end] }
      },
      order: [['attendance_date', 'DESC'], ['check_in', 'DESC']]
    });

    // 2. Payment History
    const paymentLogs = await Payment.findAll({
      where: {
        user_id: id,
        transaction_date: { [Op.between]: [start, endOfDay] }
      },
      include: [{
        model: MembershipPlan,
        attributes: ['name']
      }],
      order: [['transaction_date', 'DESC']]
    });

    const classLogs = await ClassBooking.findAll({
      where: {
        user_id: id,
        booking_date: { [Op.between]: [start, endOfDay] }
      },
      include: [{
        model: GymClass,
        attributes: ['title', 'start_time', 'end_time']
      }],
      order: [['booking_date', 'DESC']]
    });

    res.json({
      member,
      attendance: attendanceLogs.map(log => ({
        id: log.attendance_id,
        date: log.attendance_date,
        check_in: log.check_in,
        check_out: log.check_out,
        status: log.status
      })),
      payments: paymentLogs.map(log => ({
        id: log.payment_id,
        date: log.transaction_date,
        amount: parseFloat(log.amount),
        method: log.payment_method,
        status: log.status,
        plan_name: log.MembershipPlan ? log.MembershipPlan.name : 'Unknown'
      })),
      classes: classLogs.map(log => ({
        id: log.booking_id,
        date: log.booking_date,
        class_name: log.GymClass ? log.GymClass.title : 'Unknown',
        start_time: log.GymClass ? log.GymClass.start_time : null,
        end_time: log.GymClass ? log.GymClass.end_time : null,
        status: log.status
      }))
    });

  } catch (err) {
    console.error("Member Report Error:", err);
    res.status(500).json({ error: "Failed to fetch member report data" });
  }
};