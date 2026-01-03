const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Game = require('../models/game');
const User = require('../models/user');
const Tournament = require('../models/tournament');
const Transaction = require('../models/transaction');

// Middleware: Admin Access Only
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authorization error' });
    }
};

// Dashboard Stats
router.get('/stats/dashboard', authMiddleware, isAdmin, async (req, res) => {
    try {
        const [users, games, tournaments, transactions] = await Promise.all([
            User.countDocuments(),
            Game.countDocuments(),
            Tournament.find({}, 'status'),
            Transaction.find({}, 'amount status')
        ]);

        const totalRevenue = transactions
            .filter(t => t.status === 'success' || t.status === 'completed')
            .reduce((acc, curr) => acc + (curr.amount || 0), 0);

        res.json({
            success: true,
            data: {
                users: { total: users },
                games: { total: games },
                tournaments: { 
                    total: tournaments.length, 
                    active: tournaments.filter(t => t.status === 'active' || t.status === 'open').length 
                },
                financials: {
                    revenue: totalRevenue,
                    transactions: transactions.length
                }
            }
        });
    } catch (error) {
        console.error('Stats Error:', error);
        res.status(500).json({ success: false, message: 'Failed to load dashboard stats' });
    }
});

// ... (Keep your other routes for GET/DELETE games and users, they looked fine)

module.exports = router;