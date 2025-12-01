// ============================================
// TOURNAMENT ROUTES (routes/tournament.js)
// ✅ FULLY CORRECTED - PAYMENT FLOW FIXED
// ============================================

const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Game = require('../models/game');
const Transaction = require('../models/transaction');
const authMiddleware = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');

const {
  createOrder,
  verifyPaymentSignature
} = require('../services/razorpayService');
const { sendPaymentReceiptEmail } = require('../services/emailservice');

// ============================================
// GET ALL TOURNAMENTS (PUBLIC - NO AUTH)
// ============================================

router.get('/', async (req, res) => {
  try {
    console.log('📥 GET /api/tournaments - Fetching all tournaments');

    const tournaments = await Tournament.find()
      .populate('game', 'name category imageUrl')
      .populate('organizer', 'username email profileImage')
      .sort({ createdAt: -1 });

    console.log(`✅ Database returned: ${tournaments.length} tournaments`);

    res.status(200).json({
      success: true,
      count: tournaments.length,
      data: tournaments
    });

  } catch (error) {
    console.error('❌ Error fetching tournaments:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournaments',
      error: error.message
    });
  }
});

// ============================================
// GET SINGLE TOURNAMENT BY ID
// ============================================

router.get('/:id', async (req, res) => {
  try {
    console.log('📥 GET /api/tournaments/:id -', req.params.id);

    const tournament = await Tournament.findById(req.params.id)
      .populate('game', 'name category description imageUrl')
      .populate('organizer', 'username email profileImage')
      .populate('participants.user', 'username email profileImage')
      .populate('winnerId', 'username email')
      .populate('runnerUpId', 'username email');

    if (!tournament) {
      console.log('❌ Tournament not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    console.log('✅ Tournament found:', tournament.name);
    res.status(200).json({
      success: true,
      data: tournament
    });

  } catch (error) {
    console.error('❌ Error fetching tournament:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching tournament',
      error: error.message
    });
  }
});

// ============================================
// CREATE TOURNAMENT (Organizer Only)
// ============================================

router.post('/', authMiddleware, async (req, res) => {
  try {
    console.log('📥 POST /api/tournaments - User:', req.user.id);

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

    if (!name || !gameId || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, gameId, and startDate are required'
      });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    const tournament = new Tournament({
      name: name.trim(),
      description: description || '',
      game: gameId,
      organizer: req.user.id,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      maxParticipants: maxParticipants || 16,
      registrationFee: registrationFee || 0,
      isPaid: (registrationFee || 0) > 0,
      bracket: bracket || 'single-elimination',
      prizePool: prizePool || '',
      rules: rules || '',
      status: 'open',
      currentParticipants: 0,
      participants: []
    });

    await tournament.save();
    console.log('✅ Tournament created:', tournament._id, 'Status: open');

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
// UPDATE TOURNAMENT
// ============================================

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('📥 PUT /api/tournaments/:id -', req.params.id);

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own tournaments'
      });
    }

    const {
      name,
      description,
      startDate,
      endDate,
      maxParticipants,
      prizePool,
      rules,
      status
    } = req.body;

    if (name) tournament.name = name.trim();
    if (description) tournament.description = description;
    if (startDate) tournament.startDate = new Date(startDate);
    if (endDate) tournament.endDate = new Date(endDate);
    if (maxParticipants) tournament.maxParticipants = maxParticipants;
    if (prizePool) tournament.prizePool = prizePool;
    if (rules) tournament.rules = rules;
    if (status) tournament.status = status;

    await tournament.save();
    console.log('✅ Tournament updated:', tournament._id);

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      data: tournament
    });

  } catch (error) {
    console.error('❌ Error updating tournament:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error updating tournament',
      error: error.message
    });
  }
});

// ============================================
// DELETE/CANCEL TOURNAMENT
// ============================================

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    console.log('📥 DELETE /api/tournaments/:id -', req.params.id);

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own tournaments'
      });
    }

    tournament.status = 'cancelled';
    await tournament.save();

    console.log('✅ Tournament cancelled:', tournament._id);

    res.status(200).json({
      success: true,
      message: 'Tournament cancelled successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting tournament:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error deleting tournament',
      error: error.message
    });
  }
});

// ============================================
// JOIN TOURNAMENT - ✅ FIXED PAYMENT FLOW
// ============================================

router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    console.log('📥 POST /api/tournaments/:id/join -', req.params.id);
    
    const tournament = await Tournament.findById(req.params.id)
      .populate('game', 'name')
      .populate('organizer', 'username');
    
    if (!tournament) {
      console.log('❌ Tournament not found');
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user already joined
    const alreadyJoined = tournament.participants.some(
      p => p.user.toString() === req.user.id
    );
    
    if (alreadyJoined) {
      console.log('❌ User already joined');
      return res.status(400).json({
        success: false,
        message: 'You have already joined this tournament'
      });
    }

    // Check if tournament is full
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      console.log('❌ Tournament is full');
      return res.status(400).json({
        success: false,
        message: 'Tournament is full'
      });
    }

    // Allow joining in multiple statuses
    const joinableStatuses = ['draft', 'open', 'ongoing'];
    
    if (!joinableStatuses.includes(tournament.status)) {
      console.log('❌ Tournament status not joinable:', tournament.status);
      return res.status(400).json({
        success: false,
        message: `Cannot join tournament in "${tournament.status}" status`
      });
    }

    // ============================================
    // ✅ CASE 1: FREE TOURNAMENT
    // ============================================
    if (tournament.registrationFee === 0) {
      console.log('✅ FREE tournament - adding user immediately');

      tournament.participants.push({
        user: req.user.id,
        joinedAt: new Date(),
        status: 'registered',
        paymentStatus: 'completed'
      });

      tournament.currentParticipants += 1;
      await tournament.save();

      console.log('✅ User added to FREE tournament:', tournament.name);
      
      return res.json({
        success: true,
        message: 'Successfully joined tournament!',
        data: {
          tournament: {
            id: tournament._id,
            name: tournament.name,
            currentParticipants: tournament.currentParticipants,
            maxParticipants: tournament.maxParticipants,
            registrationFee: 0,
            isPaid: false
          }
        }
      });
    }

    // ============================================
    // ✅ CASE 2: PAID TOURNAMENT
    // ============================================
    console.log('💳 PAID tournament - creating payment order');

    // Create Razorpay order
    const razorpayOrder = await createOrder(
      tournament.registrationFee,
      tournament._id
    );

    // Save transaction (PENDING - user not added yet)
    const transaction = new Transaction({
      razorpayOrderId: razorpayOrder.id,
      user: req.user.id,
      tournament: tournament._id,
      amount: tournament.registrationFee,
      status: 'pending'
    });

    await transaction.save();

    console.log('✅ Payment order created:', razorpayOrder.id);
    console.log('⏳ User NOT added yet - waiting for payment verification');
    
    // Return payment details to frontend
    return res.json({
      success: true,
      message: 'Complete payment to join tournament',
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        tournament: {
          id: tournament._id,
          name: tournament.name,
          registrationFee: tournament.registrationFee,
          isPaid: true
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in JOIN:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ============================================
// LEAVE TOURNAMENT
// ============================================

router.post('/:id/leave', authMiddleware, async (req, res) => {
  try {
    console.log('📥 POST /api/tournaments/:id/leave -', req.params.id);

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    const participantIndex = tournament.participants.findIndex(
      p => p.user.toString() === req.user.id
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'You are not a participant in this tournament'
      });
    }

    tournament.participants.splice(participantIndex, 1);
    tournament.currentParticipants -= 1;
    await tournament.save();

    console.log('✅ User left:', req.user.id);

    res.status(200).json({
      success: true,
      message: 'Left tournament successfully'
    });

  } catch (error) {
    console.error('❌ Error leaving:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error leaving tournament',
      error: error.message
    });
  }
});

// ============================================
// GET PARTICIPANTS
// ============================================

router.get('/:id/participants', async (req, res) => {
  try {
    console.log('📥 GET /api/tournaments/:id/participants -', req.params.id);

    const tournament = await Tournament.findById(req.params.id)
      .populate('participants.user', 'username email profileImage');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    res.status(200).json({
      success: true,
      count: tournament.participants.length,
      data: tournament.participants
    });

  } catch (error) {
    console.error('❌ Error fetching participants:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching participants',
      error: error.message
    });
  }
});

// ============================================
// CREATE PAYMENT ORDER (for paid tournaments)
// ============================================

router.post('/:id/payment-order', authMiddleware, paymentLimiter, async (req, res) => {
  try {
    console.log('💳 POST /api/tournaments/:id/payment-order -', req.params.id);

    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    if (tournament.registrationFee <= 0) {
      return res.status(400).json({
        success: false,
        message: 'This is a free tournament'
      });
    }

    const razorpayOrder = await createOrder(tournament.registrationFee, tournament._id);

    const transaction = new Transaction({
      razorpayOrderId: razorpayOrder.id,
      user: req.user.id,
      tournament: tournament._id,
      amount: tournament.registrationFee,
      status: 'pending'
    });

    await transaction.save();

    console.log('✅ Order created:', razorpayOrder.id);

    res.status(200).json({
      success: true,
      data: {
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
});

// ============================================
// VERIFY PAYMENT - ✅ ADD USER HERE
// ============================================

router.post('/:id/payment-verify', authMiddleware, async (req, res) => {
  try {
    console.log('🔐 POST /api/tournaments/:id/payment-verify');

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment details'
      });
    }

    // Verify signature
    const isSignatureValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isSignatureValid) {
      console.log('❌ Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Find transaction
    const transaction = await Transaction.findOne({ razorpayOrderId });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();

    // Get tournament
    const tournament = await Tournament.findById(transaction.tournament);

    // ✅ ADD USER TO TOURNAMENT (AFTER PAYMENT VERIFIED)
    const existingParticipant = tournament.participants.find(
      p => p.user.toString() === req.user.id
    );

    if (!existingParticipant) {
      console.log('✅ Payment verified - adding user to tournament');
      
      tournament.participants.push({
        user: req.user.id,
        joinedAt: new Date(),
        status: 'paid',
        paymentStatus: 'completed',
        paymentId: transaction._id
      });

      tournament.currentParticipants += 1;
    } else {
      // Update existing participant
      existingParticipant.status = 'paid';
      existingParticipant.paymentStatus = 'completed';
      existingParticipant.paymentId = transaction._id;
    }

    tournament.totalCollected += transaction.amount;
    await tournament.save();

    console.log('✅ Payment verified and user added to tournament');

    // Send receipt email
    await sendPaymentReceiptEmail(
      req.user.id,
      transaction.amount,
      razorpayPaymentId,
      tournament.name
    ).catch(err => console.error('Email error:', err));

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully! You are now registered.',
      data: {
        transactionId: transaction._id,
        status: 'completed'
      }
    });

  } catch (error) {
    console.error('❌ Error verifying payment:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
});

module.exports = router;