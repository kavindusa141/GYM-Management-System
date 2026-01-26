const User = require("../models/User");
const MemberProfile = require("../models/MemberProfile");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

// 1. Get All Members
exports.getAllMembers = async (req, res) => {
  try {
    const UserSubscription = require("../models/UserSubscription");
    const MembershipPlan = require("../models/MembershipPlan");

    const members = await User.findAll({
      where: { 
        role: 'MEMBER',
        [Op.or]: [
          { is_deleted: false },
          { is_deleted: null }
        ]
      },
      // We only fetch 'status' (Database column)
      attributes: ['user_id', 'member_code', 'name', 'email', 'phone', 'status', 'created_at'],
      include: [
        { 
          model: MemberProfile, 
          attributes: ['profile_id'] 
        },
        {
          model: UserSubscription,
          attributes: ['status', 'end_date', 'plan_id'],
          include: [{ model: MembershipPlan, attributes: ['name'] }],
          order: [['end_date', 'DESC']],
          limit: 1 
        }
      ],
      order: [['user_id', 'DESC']]
    });

    const processedMembers = members.map(member => {
      const latestSub = member.UserSubscriptions && member.UserSubscriptions[0];
      let subStatus = 'NO_PLAN';
      let planName = 'N/A';
      let expiryDate = null;

      if (latestSub) {
        const today = new Date();
        const endDate = new Date(latestSub.end_date);
        
        planName = latestSub.MembershipPlan?.name || 'Unknown Plan';
        expiryDate = latestSub.end_date;

        if (endDate >= today && latestSub.status === 'ACTIVE') {
          subStatus = 'ACTIVE';
        } else {
          subStatus = 'EXPIRED';
        }
      }

      return {
        ...member.toJSON(),
        subscription_status: subStatus,
        current_plan: planName,
        expiry_date: expiryDate,
        // LOGIC: If status is 1 (true), we tell Frontend "is_verified: true"
        // This keeps the UI working without changing the database.
        is_verified: member.status === true 
      };
    });

    res.json(processedMembers);
  } catch (err) {
    console.error("Get Members Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 2. Add Member (FIXED: Uses 'status' only)
exports.addMember = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, Email, and Password are required" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ FIXED: We removed 'is_verified'.
    // We set 'status: true' which means the user is Active/Verified.
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "MEMBER",
      status: true // <--- TRUE means Verified
    });

    const customId = `RFK-M-${newUser.user_id}`;
    await newUser.update({ member_code: customId });

    res.status(201).json({ message: "Member added successfully", user: newUser });

  } catch (err) {
    console.error("Add Member Error:", err);
    res.status(500).json({ message: err.message }); 
  }
};

// 3. Soft Delete Member
exports.deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (user.role !== 'MEMBER') {
      return res.status(400).json({ message: "Can only delete members, not other roles" });
    }

    await user.update({
      is_deleted: true,
      deleted_at: new Date(),
      deletion_reason: 'Deleted by admin',
      status: false // Set status to false (Inactive)
    });

    res.json({ message: "Member deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 4. Get Employees
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { 
        role: ["STAFF", "TRAINER"],
        [Op.or]: [
          { is_deleted: false },
          { is_deleted: null }
        ]
      },
      attributes: ['user_id', 'member_code', 'name', 'email', 'phone', 'role', 'status']
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 5. Create Employee
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!["STAFF", "TRAINER"].includes(role)) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role, 
      status: true 
    });

    const prefix = role === "TRAINER" ? "RFK-T" : "RFK-S";
    const customId = `${prefix}-${newUser.user_id}`;

    await newUser.update({ member_code: customId });

    res.status(201).json({ message: `${role} created successfully`, member_code: customId });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 6. Get All Trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.findAll({
      where: { 
        role: 'TRAINER',
        [Op.or]: [
          { is_deleted: false },
          { is_deleted: null }
        ]
      },
      attributes: ['user_id', 'name', 'member_code']
    });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 7. Soft Delete Employee
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["STAFF", "TRAINER"].includes(user.role)) {
      return res.status(400).json({ message: "This endpoint is for deleting Staff or Trainers only." });
    }

    await user.update({
      is_deleted: true,
      deleted_at: new Date(),
      deletion_reason: 'Deleted by admin',
      status: false
    });

    res.json({ message: "Employee removed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Reporting / Deleted Members Getters ---

exports.getDeletedMembers = async (req, res) => {
  try {
    const deletedMembers = await User.findAll({
      where: { role: 'MEMBER', is_deleted: true },
      include: [{ model: MemberProfile, required: false }],
      order: [['deleted_at', 'DESC']]
    });
    res.json(deletedMembers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeletedMemberPaymentHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const Payment = require("../models/Payment");
    const MembershipPlan = require("../models/MembershipPlan");

    const paymentHistory = await Payment.findAll({
      where: { user_id: id },
      include: [{ model: MembershipPlan }],
      order: [['transaction_date', 'DESC']]
    });
    res.json({ payment_history: paymentHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeletedMemberSubscriptionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const UserSubscription = require("../models/UserSubscription");
    const MembershipPlan = require("../models/MembershipPlan");

    const subscriptionHistory = await UserSubscription.findAll({
      where: { user_id: id },
      include: [{ model: MembershipPlan }],
      order: [['start_date', 'DESC']]
    });
    res.json({ subscription_history: subscriptionHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeletedMemberAttendanceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const Attendance = require("../models/Attendance");
    const attendanceHistory = await Attendance.findAll({
      where: { member_id: id },
      order: [['attendance_date', 'DESC']]
    });
    res.json({ attendance_history: attendanceHistory });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};