const Payment = require("../models/Payment");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");

// --- HELPER: Activate or Renew Subscription ---
const activateSubscription = async (user_id, plan_id) => {
  const plan = await MembershipPlan.findByPk(plan_id);
  if (!plan) throw new Error("Plan not found");

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.duration_months);

  // Check if active subscription exists
  const existingSub = await UserSubscription.findOne({ where: { user_id } });

  if (existingSub) {
    // Extend existing
    await existingSub.update({
      plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE'
    });
  } else {
    // Create new
    await UserSubscription.create({
      user_id,
      plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE'
    });
  }
};

// 1. CREATE PAYMENT (Admin or Member)
exports.createPayment = async (req, res) => {
  try {
    const { plan_id, amount, payment_method, reference_number } = req.body;
    let { user_id } = req.body;

    // If request comes from a Member (via Token), use their ID
    if (!user_id && req.user) {
      user_id = req.user.id;
    }

    const slip_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!user_id || !plan_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Determine Status
    // Admin CASH/TRANSFER = Verified Immediately
    // Member CARD = Verified Immediately (Simulated)
    // Member TRANSFER = PENDING (Needs Admin Approval)
    let status = 'PENDING';
    if (req.user && req.user.role === 'ADMIN') status = 'VERIFIED';
    if (payment_method === 'CARD') status = 'COMPLETED';

    const payment = await Payment.create({
      user_id,
      plan_id,
      amount,
      payment_method,
      status,
      slip_url,
      reference_number
    });

    // IF Verified/Completed -> ACTIVATE SUBSCRIPTION NOW
    if (status === 'VERIFIED' || status === 'COMPLETED') {
      await activateSubscription(user_id, plan_id);
    }

    res.status(201).json({ 
      message: status === 'PENDING' ? "Payment submitted for verification" : "Payment successful & Plan Activated", 
      payment 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 2. VERIFY PAYMENT (Admin Action)
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (action === 'APPROVE') {
      payment.status = 'VERIFIED';
      await payment.save();
      // Activate Subscription upon Approval
      await activateSubscription(payment.user_id, payment.plan_id);
      res.json({ message: "Payment Verified & Subscription Activated" });
    } else {
      payment.status = 'FAILED';
      await payment.save();
      res.json({ message: "Payment Rejected" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. GET HISTORY
exports.getAllPayments = async (req, res) => {
  try {
    const where = {};
    // If Member, only see own payments
    if (req.user.role === 'MEMBER') {
      where.user_id = req.user.id;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        { model: User, attributes: ['name', 'member_code'] },
        { model: MembershipPlan, attributes: ['name'] }
      ],
      order: [['transaction_date', 'DESC']]
    });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};