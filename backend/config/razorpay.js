const Razorpay = require('razorpay');

// ============================================
// INITIALIZE RAZORPAY
// ============================================
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('✅ Razorpay initialized with key:', process.env.RAZORPAY_KEY_ID);

module.exports = razorpay;