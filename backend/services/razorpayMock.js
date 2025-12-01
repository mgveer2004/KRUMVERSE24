const crypto = require('crypto');
// Assuming environment variables are loaded by server.js

// ============================================
// MOCK RAZORPAY ORDER CREATION (FIXED)
// ============================================
const createOrder = async (amount, tournamentId) => {
  try {
    // Generate unique order ID
    const orderId = 'order_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    
    console.log('💳 MOCK: Creating Razorpay order:', orderId);
    console.log('💰 MOCK: Amount: ₹' + amount);

    // ✅ FIX: Returning all fields required by Razorpay checkout script
    return {
      id: orderId,
      amount: amount * 100, // Amount must be in PAISE for the frontend modal
      currency: 'INR',
      receipt: `receipt_${tournamentId}_${Date.now()}`,
      status: 'created',
      // Include key_id if Razorpay frontend expects it (safety inclusion)
      key_id: process.env.RAZORPAY_KEY_ID 
    };
  } catch (error) {
    console.error('❌ MOCK: Error creating payment order:', error);
    throw error;
  }
};

// ============================================
// VERIFY RAZORPAY SIGNATURE
// ============================================
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    console.log('🔍 MOCK: Verifying payment signature...');
    
    // Simulate successful verification during mock test
    // In a real scenario, this would use HMAC validation.
    // For mock, we simply return true if the test data is present.
    const isValid = !!orderId && !!paymentId && !!signature;

    if (isValid) {
      console.log('✅ MOCK: Signature simulated as verified.');
    } else {
      console.log('❌ MOCK: Signature verification failed.');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ MOCK: Error verifying signature:', error);
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature
};