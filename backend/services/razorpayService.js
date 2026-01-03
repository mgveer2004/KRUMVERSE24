const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config(); 

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Fail-safe initialization
if (!KEY_ID || !KEY_SECRET) {
    console.warn('⚠️ WARNING: Razorpay keys are missing. Payments will fail.');
}

const razorpay = new Razorpay({
    key_id: KEY_ID || 'mock_key',
    key_secret: KEY_SECRET || 'mock_secret'
});

const createOrder = async (amount, tournamentId) => {
    try {
        if (!KEY_ID) throw new Error('Payment gateway not configured');

        const options = {
            amount: Math.round(amount * 100), // INR to Paise
            currency: 'INR',
            receipt: `trn_${tournamentId}_${Date.now()}`,
            notes: {
                tournamentId: tournamentId.toString(),
                appName: 'KRUMVERSE'
            }
        };

        const order = await razorpay.orders.create(options);
        return order;

    } catch (error) {
        console.error('Razorpay Create Order Error:', error.message);
        throw new Error('Payment initialization failed');
    }
};

const verifyPaymentSignature = (orderId, paymentId, signature) => {
    try {
        const message = `${orderId}|${paymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', KEY_SECRET)
            .update(message)
            .digest('hex');

        return generatedSignature === signature;
    } catch (error) {
        console.error('Signature Verification Error:', error.message);
        return false;
    }
};

module.exports = {
    createOrder,
    verifyPaymentSignature
};