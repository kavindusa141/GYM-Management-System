const app = require("./src/app");
const sequelize = require("./src/config/db");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log("✅ MySQL connected");
    return sequelize.sync();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ Database connection failed:", err);
  });
