const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Newer Mongoose versions don't need the options object anymore
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;