const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { sendPaymentReceiptEmail } = require('../services/emailservice');

// --- DYNAMIC PAYMENT SERVICE SELECTION (MOCK/LIVE) ---
// This relies on USE_MOCK_PAYMENT being set in the .env file.
const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === 'true';

const paymentService = USE_MOCK_PAYMENT 
    ? require('../services/razorpayMock') 
    : require('../services/razorpayService');

const {
  createOrder,
  verifyPaymentSignature
} = paymentService;

// ============================================
// 1. GET ALL TOURNAMENTS (PUBLIC)
// ============================================

router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('game', 'name category imageUrl')
      .populate('organizer', 'username email profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: tournaments.length, data: tournaments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tournaments' });
  }
});

// ============================================
// 2. GET SINGLE TOURNAMENT BY ID
// ============================================

router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('game', 'name category description imageUrl')
      .populate('organizer', 'username email profileImage')
      .populate('participants.user', 'username email profileImage');

    if (!tournament) { return res.status(404).json({ success: false, message: 'Tournament not found' }); }
    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tournament' });
  }
});

// ============================================
// 3. CREATE TOURNAMENT (Organizer Only)
// ============================================
// ✅ FIX: Added authMiddleware to secure this route and populate req.user
router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('📥 POST /api/tournaments - User:', req.user.id);

    // This check now runs safely because authMiddleware guarantees req.user exists
    if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organizers can create tournaments'
      });
    }
    
    const {
      name,
      description,
      gameId,
      startDate,
      endDate,
      maxParticipants,
      registrationFee,
      bracket,
      prizePool,
      rules
    } = req.body;
    
    // --- Basic Validation Checks ---
    if (!name || !gameId || !startDate) {
      return res.status(400).json({ message: 'Name, Game ID, and Start Date are required.' });
    }
    if (new Date(startDate) <= new Date()) {
       return res.status(400).json({ message: 'Start date must be in the future.' });
    }

    const game = await require('../models/game').findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found.' });
    }

    const tournament = new Tournament({
      name: name.trim(),
      description: description || '',
      game: gameId,
      organizer: req.user.id, // Set the organizer ID from the authenticated user
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      maxParticipants: maxParticipants || 16,
      registrationFee: registrationFee || 0,
      isPaid: (registrationFee || 0) > 0,
      bracket: bracket || 'single-elimination',
      prizePool: prizePool || '',
      rules: rules || '',
      status: 'open',
    });

    await tournament.save();
    console.log('✅ Tournament created:', tournament._id);

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: tournament
    });

  } catch (error) {
    console.error('❌ Error creating tournament:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating tournament',
      error: error.message
    });
  }
});


// ============================================
// 4. JOIN TOURNAMENT - CORE LOGIC
// ============================================

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    console.log(`\n📥 POST /api/tournaments/:id/join - MOCK ENABLED: ${USE_MOCK_PAYMENT}`);
    
    const tournament = await Tournament.findById(req.params.id).populate('game', 'name');
    if (!tournament) { return res.status(404).json({ success: false, message: 'Tournament not found' }); }

    const userIdString = req.user.id.toString(); 
    let participant = tournament.participants.find(p => p.user?.toString() === userIdString);

    if (tournament.status !== 'open' || tournament.currentParticipants >= tournament.maxParticipants) {
      return res.status(400).json({ message: 'Registration is closed or full.' });
    }
    
    // --- FREE TOURNAMENT / ALREADY PAID ---
    if (tournament.registrationFee === 0 || (participant && participant.paymentStatus === 'completed')) {
      if (participant && participant.paymentStatus === 'completed') {
        return res.status(400).json({ success: false, message: 'You have already joined and paid for this tournament' });
      }
      
      if (!participant) {
        tournament.participants.push({ user: req.user.id, username: req.user.username, joinedAt: new Date(), status: 'registered', paymentStatus: 'completed' });
        tournament.currentParticipants += 1;
      }
      await tournament.save();
      return res.json({ success: true, message: 'Successfully joined tournament!', data: { isPaid: false } });
    }

    // --- PAID TOURNAMENT: CREATE ORDER ---
    
    const razorpayOrder = await createOrder(tournament.registrationFee, tournament._id);
    
    if (!participant) {
        tournament.participants.push({ user: req.user.id, username: req.user.username, joinedAt: new Date(), status: 'paymentpending', paymentStatus: 'pending' });
    } else {
        participant.status = 'paymentpending';
        participant.paymentStatus = 'pending';
    }
    
    await tournament.save();

    const transaction = new Transaction({
      razorpayOrderId: razorpayOrder.id,
      user: req.user.id,
      tournament: tournament._id,
      amount: tournament.registrationFee,
      status: 'pending'
    });

    await transaction.save();
    console.log('✅ Payment order created:', razorpayOrder.id);
    
    return res.json({
      success: true,
      message: 'Payment order created',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount, // in paise
        currency: razorpayOrder.currency,
        isPaid: true
      }
    });

  } catch (error) {
    console.error('❌ CRITICAL ERROR IN JOIN ROUTE:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to create payment order. Source: ${USE_MOCK_PAYMENT ? 'MOCK SYSTEM FAILED (Check mock code)' : 'LIVE RAZORPAY API ERROR (Network or Key Issue)'}`,
      error: error.message
    });
  }
});


// ============================================
// 5. VERIFY PAYMENT
// ============================================

router.post('/:id/payment-verify', authMiddleware, async (req, res) => {
  try {
    console.log(`🔐 POST /api/tournaments/:id/payment-verify - MOCK: ${USE_MOCK_PAYMENT}`);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Use dynamic verification method
    const isSignatureValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed (Invalid signature)' });
    }

    const transaction = await Transaction.findOne({ razorpayOrderId });
    if (!transaction) { return res.status(404).json({ success: false, message: 'Transaction not found' }); }

    // Update transaction and participant records 
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    const tournament = await Tournament.findById(transaction.tournament);
    let existingParticipant = tournament.participants.find(p => p.user?.toString() === req.user.id);
    
    if (existingParticipant) {
      existingParticipant.status = 'paid';
      existingParticipant.paymentStatus = 'completed';
    } else {
       tournament.participants.push({ user: req.user.id, joinedAt: new Date(), status: 'paid', paymentStatus: 'completed', paymentId: transaction._id, username: req.user.username });
       tournament.currentParticipants += 1;
    }

    tournament.totalCollected += transaction.amount;
    await tournament.save();

    await sendPaymentReceiptEmail(req.user.email, transaction.amount, razorpayPaymentId, tournament.name)
      .catch(err => console.error('Email error (Non-critical):', err));

    res.status(200).json({ success: true, message: 'Payment verified successfully! You are now registered.' });

  } catch (error) {
    console.error('❌ Error verifying payment:', error.message);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
});


module.exports = router;