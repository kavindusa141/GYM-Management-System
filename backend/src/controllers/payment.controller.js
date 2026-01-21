const Payment = require("../models/Payment");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");

// --- HELPER: Activate or Renew Subscription ---
const activateSubscription = async (user_id, plan_id) => {
  console.log(`[SUBSCRIPTION] Activating Plan ${plan_id} for User ${user_id}...`);

  const plan = await MembershipPlan.findByPk(plan_id);
  if (!plan) {
    console.error("[SUBSCRIPTION] Plan not found!");
    throw new Error("Plan not found");
  }

  // Calculate Dates
  const startDate = new Date();
  const endDate = new Date();
  
  // Ensure we add months correctly (Integer check)
  const duration = parseInt(plan.duration_months);
  endDate.setMonth(endDate.getMonth() + duration);

  console.log(`[SUBSCRIPTION] New End Date: ${endDate.toISOString().split('T')[0]}`);

  // Check for ANY existing subscription (Active or Expired)
  const existingSub = await UserSubscription.findOne({ where: { user_id } });

  if (existingSub) {
    // Update the existing row
    await existingSub.update({
      plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE'
    });
    console.log("[SUBSCRIPTION] Updated existing subscription.");
  } else {
    // Create a new row
    await UserSubscription.create({
      user_id,
      plan_id,
      start_date: startDate,
      end_date: endDate,
      status: 'ACTIVE'
    });
    console.log("[SUBSCRIPTION] Created NEW subscription.");
  }
};

// 1. CREATE PAYMENT
exports.createPayment = async (req, res) => {
  try {
    const { plan_id, amount, payment_method, reference_number } = req.body;
    let { user_id } = req.body;

    // Use Token ID if Member
    if (!user_id && req.user) {
      user_id = req.user.id;
    }

    const slip_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!user_id || !plan_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Status Logic
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

    // If Instant Payment -> Activate Now
    if (status === 'VERIFIED' || status === 'COMPLETED') {
      await activateSubscription(user_id, plan_id);
    }

    res.status(201).json({ 
      message: status === 'PENDING' ? "Payment submitted for verification" : "Payment successful & Plan Activated", 
      payment 
    });

  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. VERIFY PAYMENT (Admin)
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const payment = await Payment.findByPk(payment_id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });

    if (action === 'APPROVE') {
      payment.status = 'VERIFIED';
      await payment.save();
      
      // Activate Subscription
      await activateSubscription(payment.user_id, payment.plan_id);
      
      res.json({ message: "Payment Verified & Subscription Activated" });
    } else {
      payment.status = 'FAILED';
      await payment.save();
      res.json({ message: "Payment Rejected" });
    }
  } catch (err) {
    console.error("Verify Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. GET HISTORY
exports.getAllPayments = async (req, res) => {
  try {
    const where = {};
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