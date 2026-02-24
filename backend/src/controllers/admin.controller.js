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

// 3. Delete (Soft Delete) a member
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

// 3.1 Get Member Profile By ID (Admin/Staff View)
exports.getMemberProfileById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists first
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch profile with user details
    const profile = await MemberProfile.findOne({
      where: { user_id: id },
      include: [{
        model: User,
        attributes: ['name', 'email', 'member_code', 'phone', 'role', 'status', 'created_at']
      }]
    });

    // Check if they are actually a member
    if (user.role !== 'MEMBER') {
      // If it's staff/trainer, we might handle differently or just return what we have if the profile exists
      // But usually MemberProfile is for MEMBERS.
    }

    // Return profile or constructed object if partial
    if (!profile) {
      // If no extended profile exists yet, return basic user info
      return res.json({
        User: {
          name: user.name,
          email: user.email,
          member_code: user.member_code,
          phone: user.phone,
          role: user.role,
          status: user.status,
          created_at: user.created_at
        },
        // Empty profile fields
        user_id: user.user_id,
        age: null,
        weight: null,
        height: null
      });
    }

    res.json(profile);
  } catch (err) {
    console.error("Get Member Profile Error:", err);
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

// 8. Get Expired Members with Active Assignments
exports.getExpiredAssignedMembers = async (req, res) => {
  try {
    const MemberAssignment = require("../models/MemberAssignment");
    const UserSubscription = require("../models/UserSubscription");
    const MembershipPlan = require("../models/MembershipPlan");

    const today = new Date().toISOString().split('T')[0];

    const expiredMembers = await User.findAll({
      where: { role: 'MEMBER', is_deleted: false },
      attributes: ['user_id', 'name', 'member_code', 'email'],
      include: [
        {
          model: UserSubscription,
          required: true,
          where: {
            [Op.or]: [
              { status: 'EXPIRED' },
              { end_date: { [Op.lt]: today } }
            ]
          },
          include: [{ model: MembershipPlan, attributes: ['name'] }]
        },
        {
          model: MemberAssignment,
          as: 'MemberAssignments', // Requires correct association alias in helper/modal
          required: true,
          where: { status: 'ACTIVE' },
          include: [{ model: User, as: 'Trainer', attributes: ['name', 'member_code'] }]
        }
      ]
    });

    const processed = expiredMembers.map(m => {
      const sub = m.UserSubscriptions[0];
      const assign = m.MemberAssignments[0];

      // Calculate days expired
      const endDate = new Date(sub.end_date);
      const now = new Date();
      const diffTime = Math.abs(now - endDate);
      const daysExpired = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        user_id: m.user_id,
        name: m.name,
        member_code: m.member_code,
        plan_name: sub.MembershipPlan?.name,
        expiry_date: sub.end_date,
        days_expired: daysExpired,
        assigned_trainer: assign.Trainer?.name,
        trainer_code: assign.Trainer?.member_code,
        assignment_id: assign.assignment_id
      };
    });

    res.json(processed);
  } catch (err) {
    console.error("Get Expired Members Error:", err);
    res.status(500).json({ message: err.message });
  }
};

