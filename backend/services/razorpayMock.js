const crypto = require('crypto');

// ============================================
// MOCK RAZORPAY ORDER CREATION
// ============================================
const createOrder = async (amount, tournamentId) => {
  try {
    // Generate unique order ID
    const orderId = 'order_' + Date.now() + '_' + crypto.randomBytes(8).toString('hex');
    
    console.log('💳 Creating Razorpay order:', orderId);
    console.log('💰 Amount: ₹' + amount);

    return {
      id: orderId,
      amount: amount * 100, // Razorpay wants amount in paise
      currency: 'INR',
      receipt: `receipt_${tournamentId}_${Date.now()}`,
      status: 'created'
    };
  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    throw error;
  }
};

// ============================================
// VERIFY RAZORPAY SIGNATURE (CRITICAL SECURITY)
// ============================================
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  try {
    console.log('🔍 Verifying payment signature...');
    
    // Create HMAC SHA256 hash
    const message = orderId + '|' + paymentId;
    const hash = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(message)
      .digest('hex');

    // Compare signatures
    const isValid = hash === signature;
    
    if (isValid) {
      console.log('✅ Signature verified successfully');
    } else {
      console.log('❌ Signature verification failed - possible fraud attempt');
    }
    
    return isValid;
  } catch (error) {
    console.error('❌ Error verifying signature:', error);
    return false;
  }
};

module.exports = {
  createOrder,
  verifyPaymentSignature
};