const MemberProfile = require("../models/MemberProfile");
const User = require("../models/User"); // Import User

// GET: My Profile (With User Details)
exports.getProfile = async (req, res) => {
  try {
    const profile = await MemberProfile.findOne({ 
      where: { user_id: req.user.id },
      // Join with User table to get Name and Email
      include: [{ 
        model: User, 
        attributes: ['name', 'email', 'member_code', 'phone'] 
      }]
    });
    
    // Return profile or empty object if not set
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST: Create or Update Profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      date_of_birth, gender, weight, height, 
      fitness_goal, emergency_contact, medical_conditions 
    } = req.body;

    // 1. Calculate BMI
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    }

    // 2. Calculate Age
    let calculatedAge = null;
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms);
      calculatedAge = Math.abs(age_dt.getUTCFullYear() - 1970);
    }

    let profile = await MemberProfile.findOne({ where: { user_id: userId } });

    const profileData = {
      user_id: userId,
      date_of_birth,
      age: calculatedAge, 
      gender,
      weight,
      height,
      fitness_goal,
      emergency_contact,
      medical_conditions,
      bmi
    };

    if (profile) {
      await profile.update(profileData);
      res.json({ message: "Profile updated successfully", profile });
    } else {
      profile = await MemberProfile.create(profileData);
      res.status(201).json({ message: "Profile created successfully", profile });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};