const User = require('./User');
const MemberAssignment = require('./MemberAssignment');
const UserSubscription = require('./UserSubscription');
const MembershipPlan = require('./MembershipPlan');
const MemberProfile = require('./MemberProfile');
const WorkoutPlan = require('./WorkoutPlan');
const Payment = require('./Payment');
const ClassBooking = require('./ClassBooking');
const GymClass = require('./GymClass');
const Attendance = require('./Attendance');
const ProgressLog = require('./ProgressLog');
const WorkoutLog = require('./WorkoutLog');
const WorkoutExercise = require('./WorkoutExercise');

// User <-> MemberAssignment
User.hasMany(MemberAssignment, { foreignKey: 'member_id', as: 'MemberAssignments' });
MemberAssignment.belongsTo(User, { foreignKey: 'member_id', as: 'Member' });

User.hasMany(MemberAssignment, { foreignKey: 'trainer_id', as: 'TrainerAssignments' });
MemberAssignment.belongsTo(User, { foreignKey: 'trainer_id', as: 'Trainer' });

// User <-> UserSubscription
User.hasMany(UserSubscription, { foreignKey: 'user_id' });
UserSubscription.belongsTo(User, { foreignKey: 'user_id' });

// UserSubscription <-> MembershipPlan
MembershipPlan.hasMany(UserSubscription, { foreignKey: 'plan_id' });
UserSubscription.belongsTo(MembershipPlan, { foreignKey: 'plan_id' });

// User <-> MemberProfile
User.hasOne(MemberProfile, { foreignKey: 'user_id' });
MemberProfile.belongsTo(User, { foreignKey: 'user_id' });

// User <-> WorkoutPlan
User.hasMany(WorkoutPlan, { foreignKey: 'member_id', as: 'WorkoutPlans' });
WorkoutPlan.belongsTo(User, { foreignKey: 'member_id', as: 'Member' });
User.hasMany(WorkoutPlan, { foreignKey: 'trainer_id', as: 'CreatedPlans' });
WorkoutPlan.belongsTo(User, { foreignKey: 'trainer_id', as: 'Trainer' });

User.hasMany(WorkoutPlan, { foreignKey: 'updated_by', as: 'UpdatedPlans' });
WorkoutPlan.belongsTo(User, { foreignKey: 'updated_by', as: 'Updater' });

// WorkoutPlan <-> WorkoutExercise
WorkoutPlan.hasMany(WorkoutExercise, { foreignKey: 'plan_id' });
WorkoutExercise.belongsTo(WorkoutPlan, { foreignKey: 'plan_id' });

// User <-> Payment
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });
Payment.belongsTo(MembershipPlan, { foreignKey: 'plan_id' });

// User <-> ClassBooking
User.hasMany(ClassBooking, { foreignKey: 'user_id' });
ClassBooking.belongsTo(User, { foreignKey: 'user_id' });
GymClass.hasMany(ClassBooking, { foreignKey: 'class_id' });
ClassBooking.belongsTo(GymClass, { foreignKey: 'class_id' });

// GymClass <-> User (Trainer)
GymClass.belongsTo(User, { as: 'Trainer', foreignKey: 'trainer_id' });

// User <-> Attendance
User.hasMany(Attendance, { foreignKey: 'member_id' });
Attendance.belongsTo(User, { foreignKey: 'member_id' });
// GymClass <-> Attendance (REMOVED: Attendance model does not have class_id)
// If class attendance is needed, it should be a separate table or fields added to Attendance

// User <-> ProgressLog
User.hasMany(ProgressLog, { foreignKey: 'member_id', as: 'ProgressLogs' });
ProgressLog.belongsTo(User, { foreignKey: 'member_id', as: 'Member' });
User.hasMany(ProgressLog, { foreignKey: 'trainer_id', as: 'TrainerLogs' });
ProgressLog.belongsTo(User, { foreignKey: 'trainer_id', as: 'Trainer' });

// User <-> WorkoutLog
User.hasMany(WorkoutLog, { foreignKey: 'member_id' });
WorkoutLog.belongsTo(User, { foreignKey: 'member_id', as: 'Member' });
WorkoutPlan.hasMany(WorkoutLog, { foreignKey: 'plan_id' });
WorkoutLog.belongsTo(WorkoutPlan, { foreignKey: 'plan_id', as: 'Plan' });


module.exports = {
    User, MemberAssignment, UserSubscription, MembershipPlan, MemberProfile, WorkoutPlan,
    Payment, ClassBooking, GymClass, Attendance, ProgressLog, WorkoutLog, WorkoutExercise
};
