require('dotenv').config();

console.log('🔍 RAZORPAY KEY CHECK');
console.log('========================');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID);
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET?.substring(0, 10) + '...');

if (!process.env.RAZORPAY_KEY_ID) {
  console.error('❌ RAZORPAY_KEY_ID not found in .env');
  process.exit(1);
}

if (!process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ RAZORPAY_KEY_SECRET not found in .env');
  process.exit(1);
}

if (!process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
  console.warn('⚠️ WARNING: Using LIVE keys (should use test keys)');
}

console.log('✅ Keys look good!');

// Try to initialize Razorpay
try {
  const Razorpay = require('razorpay');
  const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  console.log('✅ Razorpay instance created successfully');
} catch (error) {
  console.error('❌ Failed to create Razorpay instance:', error.message);
}
