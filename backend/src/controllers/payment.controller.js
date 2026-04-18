/**
 * PAYMENT CONTROLLER
 * ------------------
 * Handles:
 * - Member payments (bank slip / card)
 * - Admin verification
 * - SAFE subscription replacement logic
 */

const { Op } = require("sequelize");
const Payment = require("../models/Payment");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

/**
 * ============================================================
 * HELPER FUNCTION
 * Activate subscription by REPLACING existing active one
 * ============================================================
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
 * STRIPE PAYMENTS
 * ============================================================
 */

exports.createStripeCheckoutSession = async (req, res) => {
  try {
    const { plan_id, amount, registration_fee = 0, discount_amount = 0, promo_id = null } = req.body;
    const user_id = req.user.user_id || req.user.id;

    if (!plan_id || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const plan = await MembershipPlan.findByPk(plan_id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    // Validate if user has pending bank slip
    const pendingPaymentCount = await Payment.count({
      where: { user_id, status: 'PENDING' }
    });
    if (pendingPaymentCount >= 1) {
      return res.status(400).json({ message: "You already have a pending bank slip payment. Please wait for admin approval." });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'lkr', // Or USD depending on your account
            product_data: {
              name: `Gym Membership: ${plan.name}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe expects amounts in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/member/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/member/payment/cancel`,
      metadata: {
        user_id: user_id.toString(),
        plan_id: plan_id.toString(),
        registration_fee: registration_fee.toString(),
        discount_amount: discount_amount.toString(),
        promo_id: promo_id ? promo_id.toString() : ''
      }
    });

    res.json({ id: session.id, url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.stripeWebhook = async (req, res) => {
  const payload = req.body;
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Note: To use constructEvent, you need the raw body. 
    // Usually, this means configuring express to use raw body parser for this specific route.
    // Assuming simple JSON for now, or you'd need body-parser raw setup in server.js.
    // For local dev without webhook secret checking, we can just process the event type.

    // IF USING REAL WEBHOOKS WITH SECRET:
    // event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    event = payload; // Bypass strict sig check for simplicity unless specifically set up

  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Fulfill the purchase
    const { user_id, plan_id, registration_fee, discount_amount, promo_id } = session.metadata;

    try {
      // Create Database Record
      const payment = await Payment.create({
        user_id: parseInt(user_id),
        plan_id: parseInt(plan_id),
        amount: session.amount_total / 100,
        payment_method: 'CARD', // Or 'STRIPE'
        status: 'COMPLETED',
        reference_number: session.payment_intent,
        registration_fee: registration_fee ? parseFloat(registration_fee) : 0,
        discount_amount: discount_amount ? parseFloat(discount_amount) : 0,
        promo_id: promo_id ? parseInt(promo_id) : null,
        stripe_session_id: session.id
      });

      // Activate Subscription Immediately
      await activateSubscription(parseInt(user_id), parseInt(plan_id));
      console.log(`[Stripe Webhook] Successfully processed payment for User ${user_id}`);

    } catch (dbErr) {
      console.error("[Stripe Webhook DB Error]", dbErr);
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.status(200).end();
};

exports.verifyStripeSession = async (req, res) => {
  try {
    const { session_id } = req.params;
    if (!session_id) return res.status(400).json({ message: "No session ID provided" });

    // 1. Fetch session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (!session) return res.status(404).json({ message: "Session not found" });

    // 2. Check if we already processed this payment
    const existingPayment = await Payment.findOne({ where: { stripe_session_id: session_id } });

    if (existingPayment) {
      return res.json({ message: "Payment already processed", payment: existingPayment });
    }

    // 3. If session is paid but not processed, process it now (Webhook fallback)
    if (session.payment_status === 'paid') {
      const { user_id, plan_id, registration_fee, discount_amount, promo_id } = session.metadata;

      const payment = await Payment.create({
        user_id: parseInt(user_id),
        plan_id: parseInt(plan_id),
        amount: session.amount_total / 100,
        payment_method: 'CARD',
        status: 'COMPLETED',
        reference_number: session.payment_intent,
        registration_fee: registration_fee ? parseFloat(registration_fee) : 0,
        discount_amount: discount_amount ? parseFloat(discount_amount) : 0,
        promo_id: promo_id ? parseInt(promo_id) : null,
        stripe_session_id: session.id
      });

      // Activate Subscription Immediately
      await activateSubscription(parseInt(user_id), parseInt(plan_id));
      console.log(`[Stripe Fallback] Successfully processed missed webhook for User ${user_id}`);

      return res.json({ message: "Payment processed successfully via fallback", payment });
    } else {
      return res.status(400).json({ message: "Payment not completed yet or requires action" });
    }
  } catch (err) {
    console.error("Verify Stripe Session Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * CREATE PAYMENT (Member or Admin)
 * ============================================================
 */
exports.createPayment = async (req, res) => {
  try {
    let {
      user_id, plan_id, amount, payment_method, reference_number,
      registration_fee = 0, discount_amount = 0, promo_id = null
    } = req.body;

    // ✅ Use logged-in user ID if not explicitly provided
    if (!user_id && req.user) {
      user_id = req.user.user_id || req.user.id;
    }

    // ❌ Basic validation
    if (!user_id || !plan_id || !amount) {
      console.log("PAYMENT 400 ERROR: Missing fields", { user_id, plan_id, amount });
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ===============================
    // 🔒 PAYMENT SPAM PROTECTION
    // ===============================
    // Check if this user already has a PENDING payment
    const pendingPaymentCount = await Payment.count({
      where: {
        user_id,
        status: 'PENDING'
      }
    });

    // If at least one pending payment exists → block new upload
    if (pendingPaymentCount >= 1) {
      console.log("PAYMENT 400 ERROR: Pending exists for user", user_id);
      return res.status(400).json({
        message: "You already have a pending payment awaiting admin approval"
      });
    }

    // ===============================
    // HANDLE SLIP UPLOAD
    // ===============================
    let slip_url = null;
    if (req.file) {
      slip_url = req.file.path;
    } else if (req.files && req.files.length > 0) {
      slip_url = req.files[0].path;
    }

    console.log(`[PAYMENT] User: ${user_id}, Method: ${payment_method}, File received: ${slip_url ? 'YES' : 'NO'}, Slip URL: ${slip_url}`);

    // ===============================
    // PAYMENT STATUS LOGIC
    // ===============================
    let status = 'PENDING';

    if (req.user) {
      if (req.user.role === 'ADMIN') {
        // Admin-created payment → auto verified
        status = 'VERIFIED';
      } else if (req.user.role === 'STAFF') {
        // Staff-created payment: 
        // If slip uploaded (transfer), needs admin approval
        if (payment_method === 'TRANSFER' || slip_url) {
          status = 'PENDING';
        } else {
          status = 'VERIFIED';
        }
      }
    }

    // Card payments → auto completed
    if (payment_method === 'CARD') {
      status = 'COMPLETED';
    }

    // ===============================
    // CREATE PAYMENT RECORD
    // ===============================
    const payment = await Payment.create({
      user_id,
      plan_id,
      amount,
      payment_method,
      status,
      slip_url,
      reference_number,
      registration_fee,
      discount_amount,
      promo_id
    });

    // ===============================
    // ACTIVATE SUBSCRIPTION (IF INSTANT)
    // ===============================
    if (status === 'VERIFIED' || status === 'COMPLETED') {
      await activateSubscription(user_id, plan_id);
    }

    // ===============================
    // RESPONSE
    // ===============================
    res.status(201).json({
      message:
        status === 'PENDING'
          ? "Payment submitted. Waiting for admin approval."
          : "Payment successful & membership activated",
      payment
    });

  } catch (err) {
    console.error("Create Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * VERIFY PAYMENT (ADMIN ONLY) - UPDATED
 * ============================================================
 * Now supports Rejection Reason
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { action, reason } = req.body; // APPROVE | REJECT

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
      payment.rejection_reason = null; // Clear previous rejection reason if any
      await payment.save();

      // 🔐 HARD RULE: replace existing subscription
      await activateSubscription(payment.user_id, payment.plan_id);

      return res.json({
        message: "Payment approved. Subscription replaced successfully.",
      });
    }

    // 3️⃣ Reject payment
    if (action === "REJECT") {
      payment.status = "FAILED";
      payment.rejection_reason = reason || "Payment rejected by admin"; // Store reason
      await payment.save();

      return res.json({
        message: "Payment rejected",
      });
    }

    return res.status(400).json({ message: "Invalid action" });

  } catch (err) {
    console.error("Verify Payment Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * RE-UPLOAD SLIP (MEMBER) - NEW
 * ============================================================
 * Allows members to upload a new slip for rejected payments
 */
exports.reuploadSlip = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const user_id = req.user.id;

    // 1. Find the payment ensuring it belongs to the user
    const payment = await Payment.findOne({ where: { payment_id, user_id } });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // 2. Ensure it is currently FAILED
    if (payment.status !== 'FAILED') {
      return res.status(400).json({ message: "You can only re-upload slips for rejected payments." });
    }

    // 3. Validate File
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 4. Update Payment
    payment.slip_url = req.file.path;
    payment.status = 'PENDING'; // Reset status to PENDING
    payment.rejection_reason = null; // Clear previous rejection reason

    await payment.save();

    res.json({ message: "Slip re-uploaded successfully! Waiting for approval." });

  } catch (err) {
    console.error("Re-upload Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * ============================================================
 * GET ALL PAYMENTS - UPDATED
 * ============================================================
 * Now includes rejection_reason in response
 */
exports.getAllPayments = async (req, res) => {
  try {
    const where = {};

    // Members see only their own payments
    if (req.user?.role === "MEMBER") {
      where.user_id = req.user?.user_id || req.user?.id;
    }

    const payments = await Payment.findAll({
      where,
      // Added new fields to attributes
      attributes: ['payment_id', 'user_id', 'plan_id', 'amount', 'payment_method', 'status', 'slip_url', 'reference_number', 'transaction_date', 'rejection_reason', 'registration_fee', 'discount_amount', 'promo_id'],
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

// ===============================
// GET RECEIPT DATA
// ===============================
exports.getPaymentReceipt = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const user_id = req.user.id; // From verifyToken middleware
    const userRole = req.user.role; // From verifyToken middleware

    const payment = await Payment.findByPk(payment_id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'member_code']
        },
        {
          model: MembershipPlan,
          attributes: ['name', 'price', 'duration_months']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Authorization: Member can only view their own payment, Admin can view any
    if (userRole === 'MEMBER' && payment.user_id !== user_id) {
      return res.status(403).json({ message: "You can only view your own receipts" });
    }

    // Only allow verified/completed payments
    if (!['VERIFIED', 'COMPLETED', 'SUCCESS'].includes(payment.status)) {
      return res.status(400).json({ message: "Receipt not available yet" });
    }

    // Fetch system gym name dynamically
    let gymName = "ROYAL FITNESS KINGDOM";
    try {
      const setting = await SystemSetting.findOne({ where: { key_name: "system_name" } });
      if (setting && setting.value) {
        gymName = setting.value.toUpperCase();
      }
    } catch (e) {
      console.error("Failed to fetch system name", e);
    }

    res.json({
      receipt_no: `RFK-${payment.payment_id}`,
      date: payment.transaction_date,
      member: payment.User,
      plan: payment.MembershipPlan,
      registration_fee: payment.registration_fee,
      discount_amount: payment.discount_amount,
      amount: payment.amount,
      method: payment.payment_method,
      reference: payment.reference_number,
      status: payment.status,
      gym_name: gymName
    });

  } catch (err) {
    console.error("Receipt Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ===============================
// DOWNLOAD RECEIPT AS PDF
// ===============================
exports.downloadReceiptPDF = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const user_id = req.user.id; // From verifyToken middleware
    const userRole = req.user.role; // From verifyToken middleware

    const payment = await Payment.findByPk(payment_id, {
      include: [
        {
          model: User,
          attributes: ['name', 'email', 'member_code', 'phone']
        },
        {
          model: MembershipPlan,
          attributes: ['name', 'price', 'duration_months', 'description']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Authorization: Member can only download their own receipt, Admin can download any
    if (userRole === 'MEMBER' && payment.user_id !== user_id) {
      return res.status(403).json({ message: "You can only download your own receipts" });
    }

    // Only allow verified/completed payments
    if (!['VERIFIED', 'COMPLETED', 'SUCCESS'].includes(payment.status)) {
      return res.status(400).json({ message: "Receipt not available for download yet" });
    }

    // Fetch system gym name dynamically
    let gymName = "ROYAL FITNESS KINGDOM";
    try {
      const setting = await SystemSetting.findOne({ where: { key_name: "system_name" } });
      if (setting && setting.value) {
        gymName = setting.value.toUpperCase();
      }
    } catch (e) {
      console.error("Failed to fetch system name", e);
    }

    const receiptNo = `RFK-${payment.payment_id}`;
    const transactionDate = new Date(payment.transaction_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #333; background: #f9f9f9; }
          .container { max-width: 600px; margin: 20px auto; background: white; padding: 40px; border: 1px solid #ddd; }
          .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .gym-name { font-size: 28px; font-weight: bold; color: #1e40af; }
          .tagline { font-size: 12px; color: #666; margin-top: 5px; }
          .receipt-title { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: center; color: #333; }
          .receipt-no { text-align: center; font-size: 12px; color: #666; margin-top: 5px; font-family: monospace; }
          
          .section { margin: 25px 0; }
          .section-title { font-size: 12px; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; }
          .row.total { border-top: 2px solid #1e40af; border-bottom: 2px solid #1e40af; padding: 12px 0; font-weight: bold; font-size: 16px; }
          .label { color: #666; font-weight: bold; }
          .value { text-align: right; color: #333; }
          
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
          .verified-badge { display: inline-block; margin-top: 15px; padding: 8px 15px; background: #10b981; color: white; border-radius: 4px; font-size: 12px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="gym-name">🏋️ ${gymName}</div>
          </div>

          <div class="receipt-title">PAYMENT RECEIPT</div>
          <div class="receipt-no">Receipt No: ${receiptNo}</div>

          <div class="section">
            <div class="section-title">Member Information</div>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${payment.User.name}</span>
            </div>
            <div class="row">
              <span class="label">Member ID:</span>
              <span class="value">${payment.User.member_code || 'N/A'}</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">${payment.User.email}</span>
            </div>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">${payment.User.phone || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Transaction Details</div>
            <div class="row">
              <span class="label">Date:</span>
              <span class="value">${transactionDate}</span>
            </div>
            <div class="row">
              <span class="label">Payment Method:</span>
              <span class="value">${payment.payment_method}</span>
            </div>
            ${payment.reference_number ? `
            <div class="row">
              <span class="label">Reference:</span>
              <span class="value">${payment.reference_number}</span>
            </div>
            ` : ''}
          </div>

          <div class="section">
            <div class="section-title">Plan Details</div>
            <div class="row">
              <span class="label">Plan Name:</span>
              <span class="value">${payment.MembershipPlan.name}</span>
            </div>
            <div class="row">
              <span class="label">Plan Price:</span>
              <span class="value">Rs. ${parseFloat(payment.MembershipPlan.price).toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Duration:</span>
              <span class="value">${payment.MembershipPlan.duration_months} Month(s)</span>
            </div>
            ${payment.registration_fee && payment.registration_fee > 0 ? `
            <div class="row">
              <span class="label">Registration Fee:</span>
              <span class="value">Rs. ${parseFloat(payment.registration_fee).toLocaleString()}</span>
            </div>` : ''}
            ${payment.discount_amount && payment.discount_amount > 0 ? `
            <div class="row">
              <span class="label">Discount Applied:</span>
              <span class="value">- Rs. ${parseFloat(payment.discount_amount).toLocaleString()}</span>
            </div>` : ''}
          </div>

          <div class="section">
            <div class="row total">
              <span class="label">Total Amount Paid:</span>
              <span class="value">Rs. ${payment.amount.toLocaleString()}</span>
            </div>
          </div>

          <div style="text-align: center;">
            <div class="verified-badge">✓ PAYMENT VERIFIED</div>
          </div>

          <div class="footer">
            <p>Thank you for choosing Royal Fitness!</p>
            <p style="margin-top: 10px; font-size: 10px;">This is an electronically generated receipt. No signature required.</p>
            <p style="margin-top: 10px; color: #ccc;">Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send HTML as response for client-side PDF generation
    res.json({
      success: true,
      html: htmlContent,
      fileName: `receipt-${receiptNo}.html`,
      receiptNo: receiptNo
    });

  } catch (err) {
    console.error("PDF Download Error:", err);
    res.status(500).json({ error: err.message });
  }
};