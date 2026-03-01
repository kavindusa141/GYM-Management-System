const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } = require("../utils/emailTemplates");
require("dotenv").config();

// Configure Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. REGISTER (Initiate)
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      // Note: If you previously crashed here, the user might already exist in the DB.
      // Try a different email address if you see this error.
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 mins

    // --- FIX IS HERE: Assign result to 'newUser' ---
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "MEMBER",
      status: false, // Inactive until verified
      otp_code: otp,
      otp_expires_at: otpExpiry
    });

    // 2. Generate Member ID (RFK-M-ID) using the new user's ID
    const customId = `RFK-M-${newUser.user_id}`;
    await newUser.update({ member_code: customId });

    // --- PREPARE HTML EMAIL ---
    const emailHtml = EMAIL_VERIFY_TEMPLATE
      .replace("{{email}}", email)
      .replace("{{otp}}", otp);

    // Send Email
    await transporter.sendMail({
      from: `"Royal Fitness" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Your Verification Code",
      html: emailHtml,
      text: `Your OTP code is: ${otp}. It expires in 10 minutes.`
    });

    res.status(201).json({ message: "OTP sent to email. Please verify." });

  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. VERIFY OTP (Complete Registration)
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP matches and is not expired
    if (user.otp_code !== otp || new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Activate User
    user.status = true;
    user.otp_code = null;
    user.otp_expires_at = null;
    await user.save();

    res.json({ message: "Email verified successfully! You can now login." });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user account is deleted (if column exists)
    if (user.is_deleted === true) {
      return res.status(403).json({ message: "This account has been deleted and cannot access the system." });
    }

    // Check if account is verifieda
    if (!user.status) {
      return res.status(403).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. FORGOT PASSWORD (Send Reset Link)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate secure token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash it before saving to DB
    user.reset_password_token = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.reset_password_expires = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    // Create Reset URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    // Prepare Email
    const emailHtml = PASSWORD_RESET_TEMPLATE.replace("{{reset_link}}", resetUrl);

    // Send Email
    await transporter.sendMail({
      from: `"Royal Fitness" <${process.env.SENDER_EMAIL}>`,
      to: email,
      subject: "Password Reset Request",
      html: emailHtml
    });

    res.json({ message: "Reset link sent to email" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// 5. RESET PASSWORD (Verify Token & Update)
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash the token from URL to compare with DB
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      where: {
        reset_password_token: resetTokenHash,
        reset_password_expires: { [require("sequelize").Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Update Password
    user.password = await bcrypt.hash(password, 10);
    user.reset_password_token = null;
    user.reset_password_expires = null;
    await user.save();

    res.json({ message: "Password updated! You can now login." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};