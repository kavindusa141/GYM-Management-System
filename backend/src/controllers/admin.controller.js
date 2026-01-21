const User = require("../models/User");
const MemberProfile = require("../models/MemberProfile");
const bcrypt = require("bcrypt");

// 1. Get All Members
exports.getAllMembers = async (req, res) => {
  try {
    const members = await User.findAll({
      where: { role: 'MEMBER' },
      // Included 'member_code' so IDs show up nicely
      // Removed 'created_at' to prevent database errors if column is missing
      attributes: ['user_id', 'member_code', 'name', 'email', 'phone', 'status', 'created_at'],
      include: [
        { 
          model: MemberProfile, 
          attributes: ['profile_id'] // Check if they have set up their profile
        }
      ],
      order: [['user_id', 'DESC']] // Newest members first
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Add Member (Admin Feature)
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

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role: "MEMBER",
      status: true
    });

    // Generate RFK-M-ID
    const customId = `RFK-M-${newUser.user_id}`;
    await newUser.update({ member_code: customId });

    res.status(201).json({ message: "Member added successfully", user: newUser });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Delete User
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Get All Trainers (Needed for Dropdowns in Class Management)
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.findAll({
      where: { role: 'TRAINER' },
      attributes: ['user_id', 'name', 'email']
    });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Get All Employees (Staff & Trainers)
exports.getEmployees = async (req, res) => {
  try {
    const employees = await User.findAll({
      where: { 
        role: ["STAFF", "TRAINER"] 
      },
      // FIXED: Added 'member_code' and removed 'created_at' to prevent 500 errors
      attributes: ['user_id', 'member_code', 'name', 'email', 'phone', 'role', 'status']
    });
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Create Employee (Staff or Trainer)
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

    // --- FIX APPLIED HERE ---
    // Previously: await User.create(...) without assigning to 'newUser'
    // Fixed: const newUser = await User.create(...)
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      role, 
      status: true 
    });

    // Generate Custom ID
    const prefix = role === "TRAINER" ? "RFK-T" : "RFK-S";
    const customId = `${prefix}-${newUser.user_id}`;

    // Update with the new code
    await newUser.update({ member_code: customId });

    res.status(201).json({ message: `${role} created successfully`, member_code: customId });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: Get All Trainers (for Dropdowns)
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.findAll({
      where: { role: 'TRAINER' },
      attributes: ['user_id', 'name', 'member_code'] // We only need these for the list
    });
    res.json(trainers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};