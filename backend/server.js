const app = require("./src/app");
const sequelize = require("./src/config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

// Initialize Associations
require("./src/models/associations");

sequelize.authenticate()
  .then(() => {
    console.log("✅ MySQL connected");
    return sequelize.sync({ alter: false }); // Ensure alter is false for stability unless needed
  })
  .then(() => {
    // Start the Scheduler
    const startExpiryScheduler = require('./src/cron/expiryScheduler');
    startExpiryScheduler();

    const { startScheduler } = require('./src/jobs/notification.jobs');
    startScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err);
  });
