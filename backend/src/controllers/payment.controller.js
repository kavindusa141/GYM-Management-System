/**
 * PAYMENT CONTROLLER
 * ------------------
 * Handles:
 *  - Member payments (bank slip / card)
 *  - Admin verification
 *  - SAFE subscription replacement logic
 */

const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");

/**
 * ============================================================
 * HELPER FUNCTION
 * Activate subscription by REPLACING existing active one
 * ============================================================
 *
 * BUSINESS RULE:
 * - User can have ONLY ONE ACTIVE subscription
 * - If a new plan is approved:
 *    → Old ACTIVE subscription becomes EXPIRED
 *    → New subscription is created as ACTIVE
 *
 * This function is the SINGLE SOURCE OF TRUTH
 */
const activateSubscription = async (user_id, plan_id) => {
  console.log(`[SUBSCRIPTION] Activating plan ${plan_id} for user ${user_id}`);

  // 1️⃣ Validate membership plan
  const plan = await MembershipPlan.findByPk(plan_id);
  if (!plan) {
    throw new Error("Membership plan not found");
  }

  // 2️⃣ Find currently ACTIVE subscription (if any)
  const existingSubscription = await UserSubscription.findOne({
    where: {
      user_id,
      status: "ACTIVE",
    },
  });

  // 3️⃣ Expire old subscription (KEEP HISTORY)
  if (existingSubscription) {
    await existingSubscription.update({ status: "EXPIRED" });
    console.log(`[SUBSCRIPTION] Old subscription expired`);
  }

  // 4️⃣ Calculate subscription dates
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(
    endDate.getMonth() + parseInt(plan.duration_months)
  );

  // 5️⃣ Create NEW ACTIVE subscription
  await UserSubscription.create({
    user_id,
    plan_id,
    start_date: startDate,
    end_date: endDate,
    status: "ACTIVE",
  });

  console.log(`[SUBSCRIPTION] New subscription activated`);
};

/**
 * ============================================================
 * CREATE PAYMENT (Member or Admin)
 * ============================================================
 *
 * FLOW:
 * - Member uploads slip → status = PENDING
 * - Admin adds payment manually → VERIFIED
 * - Card payment → COMPLETED
 *
 * Subscription is activated ONLY if:
 * - VERIFIED (admin)
 * - COMPLETED (card)
 */
exports.createPayment = async (req, res) => {
  try {
    let {
      user_id,
      plan_id,
      amount,
      payment_method,
      reference_number,
    } = req.body;

    // 1️⃣ If user_id not sent, take it from JWT token
    if (!user_id && req.user) {
      user_id = req.user.user_id || req.user.id;
    }

    // 2️⃣ Basic validation
    if (!user_id || !plan_id || !amount) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    // 3️⃣ Handle bank slip upload
    const slip_url = req.file
      ? `/uploads/${req.file.filename}`
      : null;

    // 4️⃣ Determine initial payment status
    let status = "PENDING";

    // Admin manually creating payment
    if (req.user?.role === "ADMIN") {
      status = "VERIFIED";
    }

    // Card payment
    if (payment_method === "CARD") {
      status = "COMPLETED";
    }

    // 5️⃣ Create payment record
    const payment = await Payment.create({
      user_id,
      plan_id,
      amount,
      payment_method,
      status,
      slip_url,
      reference_number,
    });

    // 6️⃣ Activate subscription ONLY if payment is valid
    if (status === "VERIFIED" || status === "COMPLETED") {
      await activateSubscription(user_id, plan_id);
    }

    return res.status(201).json({
      message:
        status === "PENDING"
          ? "Payment submitted. Waiting for admin verification."
          : "Payment successful. Subscription updated.",
      payment,
    });
  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * VERIFY PAYMENT (ADMIN ONLY)
 * ============================================================
 *
 * Admin can:
 * - APPROVE → Activate subscription (replace old one)
 * - REJECT  → Mark payment as FAILED
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { action } = req.body; // APPROVE | REJECT

    // 1️⃣ Find payment
    const payment = await Payment.findByPk(payment_id);
    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    // 2️⃣ Approve payment
    if (action === "APPROVE") {
      payment.status = "VERIFIED";
      await payment.save();

      // 🔐 HARD RULE: replace existing subscription
      await activateSubscription(payment.user_id, payment.plan_id);

      return res.json({
        message: "Payment approved. Subscription replaced successfully.",
      });
    }

    // 3️⃣ Reject payment
    payment.status = "FAILED";
    await payment.save();

    return res.json({
      message: "Payment rejected",
    });
  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * GET ALL PAYMENTS
 * ============================================================
 *
 * - Admin → sees all payments
 * - Member → sees only own payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const where = {};

    // Members see only their own payments
    if (req.user.role === "MEMBER") {
      where.user_id = req.user.user_id || req.user.id;
    }

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: User,
          attributes: ["name", "member_code"],
        },
        {
          model: MembershipPlan,
          attributes: ["name"],
        },
      ],
      order: [["transaction_date", "DESC"]],
    });

    res.json(payments);
  } catch (err) {
    console.error("Get Payments Error:", err);
    res.status(500).json({ error: err.message });
  }
};
