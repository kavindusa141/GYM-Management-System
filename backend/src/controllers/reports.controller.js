const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Payment = require("../models/Payment");
const Attendance = require("../models/Attendance");
const MembershipPlan = require("../models/MembershipPlan");
const UserSubscription = require("../models/UserSubscription");

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

    // Response
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
      peak_hours: peakHours.map(h => ({
        hour: `${h.hour}:00`,
        count: parseInt(h.count)
      })),
      membership: memberships.map(m => ({
        plan_name: m.plan_name || 'Legacy',
        plan_price: parseFloat(m.plan_price || 0),
        member_count: parseInt(m.member_count),
        estimated_value: parseFloat(m.plan_price || 0) * parseInt(m.member_count)
      }))
    });

  } catch (err) {
    console.error("Reports Error:", err);
    res.status(500).json({ error: "Failed to generate reports" });
  }
};