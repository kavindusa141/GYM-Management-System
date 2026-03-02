// Load environment variables so DB connects
require('dotenv').config();
const sequelize = require('../src/config/db');

// Initialize associations
require('../src/models/associations');

// Import all models to ensure they are registered with Sequelize
const User = require('../src/models/User');
const MemberProfile = require('../src/models/MemberProfile');
const MembershipPlan = require('../src/models/MembershipPlan');
const UserSubscription = require('../src/models/UserSubscription');
const Payment = require('../src/models/Payment');
const GymClass = require('../src/models/GymClass');
const ClassBooking = require('../src/models/ClassBooking');
const Attendance = require('../src/models/Attendance');
const WorkoutPlan = require('../src/models/WorkoutPlan');
const WorkoutExercise = require('../src/models/WorkoutExercise');
const WorkoutLog = require('../src/models/WorkoutLog');
const TrainerAvailability = require('../src/models/TrainerAvailability');
const MemberAssignment = require('../src/models/MemberAssignment');
const ProgressLog = require('../src/models/ProgressLog');

const factoryReset = async () => {
    console.log("=================================================");
    console.log("⚠️  GYM SYSTEM FACTORY RESET INITIATED  ⚠️");
    console.log("=================================================");
    console.log("This will permanently delete all transactional, member, and class data.");
    console.log("Only Administrative Users will be kept.");

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Database');

        // Disable Foreign Key Checks to allow truncation without constraint errors
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { raw: true });

        // 1. Clear Transactional & Child Data
        console.log('🗑️  Deleting Payments, Bookings, Logs, and Metrics...');
        await Payment.destroy({ truncate: true, cascade: true });
        await ClassBooking.destroy({ truncate: true, cascade: true });
        await Attendance.destroy({ truncate: true, cascade: true });
        await WorkoutLog.destroy({ truncate: true, cascade: true });
        await WorkoutExercise.destroy({ truncate: true, cascade: true });
        await ProgressLog.destroy({ truncate: true, cascade: true });
        await TrainerAvailability.destroy({ truncate: true, cascade: true });
        await MemberAssignment.destroy({ truncate: true, cascade: true });

        // 2. Clear Member Profiles & Subscriptions
        console.log('🗑️  Deleting Member Profiles and Subscriptions...');
        await MemberProfile.destroy({ truncate: true, cascade: true });
        await UserSubscription.destroy({ truncate: true, cascade: true });

        // 3. Clear Core Setup Data (Classes, Plans)
        console.log('🗑️  Deleting Gym Classes and Plans...');
        await GymClass.destroy({ truncate: true, cascade: true });
        await WorkoutPlan.destroy({ truncate: true, cascade: true });
        await MembershipPlan.destroy({ truncate: true, cascade: true });

        // 4. Delete Users (Keep ADMIN, delete rest)
        // We use pure query to ignore scopes like is_deleted
        console.log('🗑️  Deleting All Users (except "ADMIN" role)...');
        await sequelize.query(`DELETE FROM users WHERE role != 'ADMIN'`, { raw: true });

        // 5. Reset Auto Increment Counters
        // This makes sure the next member is ID #1 again (or technically, following the Admin ID if shared).
        console.log('🔄 Resetting Auto-Increment Counters...');
        const tables = [
            'users',
            'member_profiles',
            'membership_plans',
            'user_subscriptions',
            'payments',
            'gym_classes',
            'class_bookings',
            'attendance',
            'workout_plans',
            'workout_logs',
            'health_metrics',
            'member_assignments',
            'progress_logs'
        ];

        for (let table of tables) {
            try {
                // Ignore errors if table doesn't exist
                await sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`, { raw: true });
            } catch (err) {
                // Silently skip
            }
        }

        // Re-enable Foreign Key Checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true });

        console.log("=================================================");
        console.log('✅ FACTORY RESET COMPLETE. THE SYSTEM IS NOW FRESH.');
        console.log("=================================================");
        process.exit(0);

    } catch (error) {
        console.error('❌ Reset failed:', error);
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { raw: true }); // ensure re-enabled on crash
        process.exit(1);
    }
};

factoryReset();
