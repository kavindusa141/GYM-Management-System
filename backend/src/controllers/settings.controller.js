const User = require("../models/User");
const SystemSetting = require("../models/SystemSetting");
const bcrypt = require("bcrypt");
const { Op } = require("sequelize");

// --- USER SETTINGS (Member & Admin) ---

exports.getAccountInfo = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['name', 'email', 'phone']
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 1. Update Account Info (SAFER VERSION)
exports.updateAccountInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updates = {};

    // Logic: Only add to 'updates' object if the new value is provided and not empty.
    // This prevents overwriting existing data with null/empty strings.

    if (name && name.trim().length > 0) {
      updates.name = name;
    }

    if (email && email.trim().length > 0) {
      // Check if email is being changed to one that already exists
      if (email !== user.email) {
        const emailExists = await User.findOne({
          where: {
            email: email,
            user_id: { [Op.ne]: userId } // Exclude current user
          }
        });
        if (emailExists) {
          return res.status(400).json({ message: "Email is already in use by another account." });
        }
      }
      updates.email = email;
    }

    // Phone is optional, but if provided, update it.
    if (phone !== undefined) {
      updates.phone = phone;
    }

    // Only perform update if there is data to change
    if (Object.keys(updates).length > 0) {
      await user.update(updates);
    }

    // Reload user to get the absolute latest data from DB
    await user.reload();

    res.json({
      message: "Account details updated successfully",
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findByPk(userId);

    // Verify old password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- SYSTEM SETTINGS (Admin Only) ---

exports.updateSystemSettings = async (req, res) => {
  try {
    // Include registration_fee
    const { system_name, gym_location, contact_email, contact_phone, registration_fee } = req.body;

    // Helper to update or create
    const upsert = async (key, val) => {
      if (!val) return; // Skip if empty
      const found = await SystemSetting.findOne({ where: { key_name: key } });
      if (found) {
        await found.update({ value: val });
      } else {
        await SystemSetting.create({ key_name: key, value: val });
      }
    };

    if (system_name) await upsert('system_name', system_name);
    if (gym_location) await upsert('gym_location', gym_location);
    if (contact_email) await upsert('contact_email', contact_email);
    if (contact_phone) await upsert('contact_phone', contact_phone);
    if (registration_fee !== undefined) await upsert('registration_fee', registration_fee.toString());

    res.json({ message: "System configuration updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get System Settings (Public) - UPDATE DEFAULTS
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findAll();
    const config = {};
    settings.forEach(s => config[s.key_name] = s.value);

    // Default Fallbacks
    if (!config.system_name) config.system_name = "Royal Fitness Kingdom";
    if (!config.gym_location) config.gym_location = "Colombo, Sri Lanka";
    if (!config.contact_email) config.contact_email = "royalfitnesskingdom12.com";
    if (!config.contact_phone) config.contact_phone = "+94 11 234 5678";
    if (!config.registration_fee) config.registration_fee = "0.00";

    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};