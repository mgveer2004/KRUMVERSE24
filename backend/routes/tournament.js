const express = require('express');
const router = express.Router();
const Tournament = require('../models/tournament');
const Transaction = require('../models/transaction');
const Game = require('../models/game');
const authMiddleware = require('../middleware/authMiddleware');
const { paymentLimiter } = require('../middleware/rateLimiter');
const { sendPaymentReceiptEmail } = require('../services/emailservice');

// Payment Service Strategy (Mock vs Live)
const USE_MOCK_PAYMENT = process.env.USE_MOCK_PAYMENT === 'true';
const paymentService = USE_MOCK_PAYMENT 
    ? require('../services/razorpayMock') 
    : require('../services/razorpayService');

const { createOrder, verifyPaymentSignature } = paymentService;

// Get All Tournaments
router.get('/', async (req, res) => {
    try {
        const tournaments = await Tournament.find()
            .populate('game', 'name category imageUrl')
            .populate('organizer', 'username email')
            .sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: tournaments.length, data: tournaments });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error fetching tournaments' });
    }
});

// Get Single Tournament
router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('game', 'name description imageUrl')
            .populate('organizer', 'username')
            .populate('participants.user', 'username profileImage');
        
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
        res.status(200).json({ success: true, data: tournament });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create Tournament (Organizer Only)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (!['organizer', 'admin'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied. Organizers only.' });
        }

        const { name, gameId, startDate, registrationFee, maxParticipants } = req.body;
        
        // Validate game existence
        const game = await Game.findById(gameId);
        if (!game) return res.status(404).json({ message: 'Invalid Game ID' });

        const tournament = new Tournament({
            ...req.body,
            game: gameId,
            organizer: req.user.id,
            isPaid: (registrationFee || 0) > 0,
            startDate: new Date(startDate),
            status: 'open'
        });

        await tournament.save();
        res.status(201).json({ success: true, data: tournament });

    } catch (error) {
        console.error('Create Tournament Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create tournament' });
    }
});

// Join Tournament (Protected + Rate Limited)
router.post('/:id/join', authMiddleware, paymentLimiter, async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });

        if (tournament.status !== 'open' || tournament.currentParticipants >= tournament.maxParticipants) {
            return res.status(400).json({ success: false, message: 'Registration closed or full' });
        }

        const userId = req.user.id;
        const participant = tournament.participants.find(p => p.user.toString() === userId);

        // Check if already joined/paid
        if (participant && participant.paymentStatus === 'completed') {
            return res.status(400).json({ success: false, message: 'Already registered' });
        }

        // Handle Free Entry
        if (tournament.registrationFee === 0) {
            if (!participant) {
                tournament.participants.push({ user: userId, username: req.user.username, status: 'registered', paymentStatus: 'completed' });
                tournament.currentParticipants += 1;
                await tournament.save();
            }
            return res.json({ success: true, message: 'Joined successfully', data: { isPaid: false } });
        }

        // Handle Paid Entry - Create Order
        const order = await createOrder(tournament.registrationFee, tournament._id);
        
        // Update or Add Participant Record
        if (participant) {
            participant.status = 'paymentpending';
            participant.paymentStatus = 'pending';
        } else {
            tournament.participants.push({ user: userId, username: req.user.username, status: 'paymentpending', paymentStatus: 'pending' });
        }
        await tournament.save();

        // Log Transaction
        await Transaction.create({
            razorpayOrderId: order.id,
            user: userId,
            tournament: tournament._id,
            amount: tournament.registrationFee,
            status: 'pending'
        });

        res.json({ 
            success: true, 
            data: { orderId: order.id, amount: order.amount, currency: order.currency, isPaid: true } 
        });

    } catch (error) {
        console.error('Join Error:', error);
        res.status(500).json({ success: false, message: 'Payment initialization failed' });
    }
});

// Verify Payment Webhook/Callback
router.post('/:id/payment-verify', authMiddleware, async (req, res) => {
    try {
        const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
        
        if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            return res.status(400).json({ success: false, message: 'Invalid payment signature' });
        }

        const transaction = await Transaction.findOne({ razorpayOrderId });
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

        // Update Transaction
        transaction.razorpayPaymentId = razorpayPaymentId;
        transaction.razorpaySignature = razorpaySignature;
        transaction.status = 'completed';
        transaction.completedAt = new Date();
        await transaction.save();

        // Update Tournament Participant
        const tournament = await Tournament.findById(transaction.tournament);
        const participant = tournament.participants.find(p => p.user.toString() === req.user.id);
        
        if (participant) {
            participant.status = 'paid';
            participant.paymentStatus = 'completed';
            participant.paymentId = transaction._id;
        } else {
            // Fallback if participant record missing
            tournament.participants.push({ 
                user: req.user.id, 
                username: req.user.username, 
                status: 'paid', 
                paymentStatus: 'completed', 
                paymentId: transaction._id 
            });
            tournament.currentParticipants += 1;
        }

        tournament.totalCollected += transaction.amount;
        await tournament.save();

        // Send Receipt (Async)
        sendPaymentReceiptEmail(req.user.email, transaction.amount, razorpayPaymentId, tournament.name)
            .catch(err => console.warn('Email delivery failed:', err.message));

        res.json({ success: true, message: 'Payment verified. Registration complete.' });

    } catch (error) {
        console.error('Payment Verification Error:', error);
        res.status(500).json({ success: false, message: 'Verification failed' });
    }
});

module.exports = router;