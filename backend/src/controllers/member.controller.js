const MemberProfile = require("../models/MemberProfile");

// GET: My Profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await MemberProfile.findOne({ where: { user_id: req.user.id } });
    // Return empty object if no profile found (prevents frontend errors)
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
      fitness_goal, activity_level, emergency_contact, medical_conditions 
    } = req.body;

    // --- VALIDATION 1: BMI Calculation ---
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
    }

    // --- VALIDATION 2: Age Calculation ---
    // We calculate age automatically from DOB to ensure accuracy
    let calculatedAge = null;
    if (date_of_birth) {
      const dob = new Date(date_of_birth);
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms);
      calculatedAge = Math.abs(age_dt.getUTCFullYear() - 1970);
    }

    // --- VALIDATION 3: Check for Existing Profile ---
    let profile = await MemberProfile.findOne({ where: { user_id: userId } });

    const profileData = {
      user_id: userId,
      date_of_birth,
      age: calculatedAge, // Save the calculated age
      gender,
      weight,
      height,
      fitness_goal,
      activity_level,
      emergency_contact,
      medical_conditions,
      bmi
    };

    if (profile) {
      // Update existing profile (avoid duplicate error)
      await profile.update(profileData);
      res.json({ message: "Profile updated successfully", profile });
    } else {
      // Create new profile
      profile = await MemberProfile.create(profileData);
      res.status(201).json({ message: "Profile created successfully", profile });
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};