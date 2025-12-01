const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('\n🔄 Attempting to connect to MongoDB...');
    console.log(`📍 Connection URI: ${process.env.MONGODB_URI.substring(0, 30)}...`);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // no deprecated options like useUnifiedTopology or useNewUrlParser
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`🌐 Host: ${conn.connection.host}`);
    console.log(`📁 Database: ${conn.connection.name}\n`);

    return conn;
  } catch (error) {
    console.error(`\n❌ MongoDB Connection Failed!`);
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('IP')) {
      console.error('💡 FIX: Go to MongoDB Atlas → Network Access → Add IP Address (0.0.0.0/0)\n');
    }

    throw error;
  }
};

mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

module.exports = connectDB;
