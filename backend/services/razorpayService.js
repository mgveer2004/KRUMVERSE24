// ============================================
// RAZORPAY SERVICE - COMPLETE WORKING
// ============================================
// Status: ✅ CORRECT & WORKING
// Use this file for REAL payments

const Razorpay = require('razorpay');
const crypto = require('crypto');

// ============================================
// INITIALIZE RAZORPAY WITH REAL CREDENTIALS
// ============================================

console.log('🚀 Initializing Razorpay...');
console.log('📍 Key ID:', process.env.RAZORPAY_KEY_ID?.slice(0, 15) + '...');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

console.log('✅ Razorpay initialized successfully!');

// ============================================
// CREATE ORDER (REAL RAZORPAY)
// ============================================

const createOrder = async (amount, tournamentId) => {
    try {
        console.log('💳 Creating Razorpay order...');
        console.log('  📊 Amount: ₹' + amount);
        console.log('  🎮 Tournament ID: ' + tournamentId);

        const options = {
            amount: Math.round(amount * 100), // Convert to paise (Razorpay requirement)
            currency: 'INR',
            receipt: `tournament_${tournamentId}_${Date.now()}`,
            notes: {
                tournamentId: tournamentId.toString(),
                appName: 'KRUMVERSE',
                description: 'Tournament Registration Fee'
            }
        };

        const order = await razorpay.orders.create(options);

        console.log('✅ Order created successfully!');
        console.log('  📋 Order ID:', order.id);
        console.log('  💰 Amount:', order.amount / 100, 'INR');
        console.log('  ⏱️ Status:', order.status);

        return order;

    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error.message);
        throw new Error('Failed to create payment order: ' + error.message);
    }
};

// ============================================
// VERIFY PAYMENT SIGNATURE (CRITICAL SECURITY)
// ============================================

const verifyPaymentSignature = (orderId, paymentId, signature) => {
    try {
        console.log('🔐 Verifying payment signature...');
        console.log('  📋 Order ID:', orderId);
        console.log('  💳 Payment ID:', paymentId);

        // Create the expected signature using YOUR secret key
        const message = `${orderId}|${paymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(message)
            .digest('hex');

        // Compare signatures
        const isValid = generatedSignature === signature;

        if (isValid) {
            console.log('✅ Signature verified! Payment is genuine!');
        } else {
            console.log('❌ Invalid signature! Possible fraud attempt!');
            console.log('  Expected:', generatedSignature.slice(0, 20) + '...');
            console.log('  Received:', signature.slice(0, 20) + '...');
        }

        return isValid;

    } catch (error) {
        console.error('❌ Error verifying signature:', error.message);
        return false;
    }
};

// ============================================
// GET PAYMENT DETAILS (OPTIONAL)
// ============================================

const getPaymentDetails = async (paymentId) => {
    try {
        console.log('📥 Fetching payment details for:', paymentId);

        const payment = await razorpay.payments.fetch(paymentId);

        console.log('✅ Payment details fetched successfully');
        console.log('  💰 Amount:', payment.amount / 100, 'INR');
        console.log('  📊 Status:', payment.status);

        return payment;

    } catch (error) {
        console.error('❌ Error fetching payment:', error.message);
        throw error;
    }
};

// ============================================
// REFUND PAYMENT (OPTIONAL)
// ============================================

const refundPayment = async (paymentId, amount) => {
    try {
        console.log('💸 Creating refund...');
        console.log('  💳 Payment ID:', paymentId);
        console.log('  💰 Amount: ₹' + amount);

        const refund = await razorpay.payments.refund(paymentId, {
            amount: Math.round(amount * 100)
        });

        console.log('✅ Refund created successfully');
        console.log('  📋 Refund ID:', refund.id);
        console.log('  📊 Status:', refund.status);

        return refund;

    } catch (error) {
        console.error('❌ Error creating refund:', error.message);
        throw error;
    }
};

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

module.exports = {
    createOrder,
    verifyPaymentSignature,
    getPaymentDetails,
    refundPayment,
    razorpay
};

console.log('✅ Razorpay Service Ready!');