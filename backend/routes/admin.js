const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const Game = require('../models/game');
const User = require('../models/user.js');
const router = express.Router();

// Try to import Tournament model (it may not exist yet)
let Tournament;
try {
  Tournament = require('../models/tournament');
} catch (e) {
  console.warn('⚠️ Tournament model not found, skipping tournaments endpoints');
}

// Try to import Transaction model (it may not exist yet)
let Transaction;
try {
  Transaction = require('../models/transaction');
} catch (e) {
  console.warn('⚠️ Transaction model not found, skipping transaction endpoints');
}

// ============================================
// ADMIN MIDDLEWARE - Check if user is admin
// ============================================
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================
// GET ALL GAMES
// ============================================
router.get('/games', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📋 Fetching all games for admin');
    const games = await Game.find({}).select('_id name description image rules');
    console.log(`✅ Found ${games.length} games`);
    res.json({ success: true, count: games.length, data: games });
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ success: false, message: 'Error fetching games' });
  }
});

// ============================================
// CREATE NEW GAME
// ============================================
router.post('/games', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('🎮 Creating new game');
    const { name, description, image, rules, maxPlayers } = req.body;

    if (!name || !description) {
      return res.status(400).json({ success: false, message: 'Name and description are required' });
    }

    const existingGame = await Game.findOne({ name: { $regex: name, $options: 'i' } });
    if (existingGame) {
      return res.status(409).json({ success: false, message: 'Game with this name already exists' });
    }

    const newGame = new Game({
      name: name.trim(),
      description: description.trim(),
      image: image || null,
      rules: rules || null,
      maxPlayers: maxPlayers || 100,
      createdBy: req.user._id,
      createdAt: new Date()
    });

    const savedGame = await newGame.save();
    console.log('✅ Game created:', savedGame._id);
    res.status(201).json({ success: true, message: 'Game created successfully', data: savedGame });
  } catch (error) {
    console.error('❌ Error creating game:', error);
    res.status(500).json({ success: false, message: 'Error creating game' });
  }
});

// ============================================
// DELETE GAME
// ============================================
router.delete('/games/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('🗑️ Deleting game:', req.params.id);
    const deletedGame = await Game.findByIdAndDelete(req.params.id);
    if (!deletedGame) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    console.log('✅ Game deleted:', req.params.id);
    res.json({ success: true, message: 'Game deleted successfully', data: deletedGame });
  } catch (error) {
    console.error('❌ Error deleting game:', error);
    res.status(500).json({ success: false, message: 'Error deleting game' });
  }
});

// ============================================
// GET ALL USERS
// ============================================
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('👥 Fetching all users');
    const users = await User.find({})
      .select('_id username email role emailVerified createdAt')
      .limit(1000);
    console.log(`✅ Found ${users.length} users`);
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
});

// ============================================
// DELETE USER
// ============================================
router.delete('/users/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('🗑️ Deleting user:', req.params.id);
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log('✅ User deleted:', req.params.id);
    res.json({ success: true, message: 'User deleted successfully', data: deletedUser });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

// ============================================
// GET ALL TOURNAMENTS (WITH ERROR HANDLING)
// ============================================
router.get('/tournaments', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('🏆 Fetching all tournaments');
    
    if (!Tournament) {
      console.warn('⚠️ Tournament model not available');
      return res.json({ success: true, count: 0, data: [] });
    }

    const tournaments = await Tournament.find({})
      .select('_id name game prize status createdBy createdAt participants')
      .populate('createdBy', 'username email')
      .limit(1000);

    console.log(`✅ Found ${tournaments.length} tournaments`);
    res.json({ success: true, count: tournaments.length, data: tournaments });
  } catch (error) {
    console.error('❌ Error fetching tournaments:', error);
    res.json({ success: true, count: 0, data: [] }); // Return empty instead of error
  }
});

// ============================================
// GET ALL TRANSACTIONS (WITH ERROR HANDLING)
// ============================================
router.get('/transactions', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('💳 Fetching all transactions');
    
    if (!Transaction) {
      console.warn('⚠️ Transaction model not available');
      return res.json({ 
        success: true, 
        count: 0,
        totalAmount: 0,
        successfulTransactions: 0,
        data: [] 
      });
    }

    const transactions = await Transaction.find({})
      .select('_id orderId paymentId amount status userId createdAt')
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(1000);

    const totalTransactions = transactions.length;
    const totalAmount = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const successfulTransactions = transactions.filter(t => t.status === 'success').length;

    console.log(`✅ Found ${totalTransactions} transactions, Total: ₹${totalAmount}`);

    res.json({
      success: true,
      count: totalTransactions,
      totalAmount,
      successfulTransactions,
      data: transactions
    });
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    res.json({ 
      success: true, 
      count: 0,
      totalAmount: 0,
      successfulTransactions: 0,
      data: [] 
    }); // Return empty instead of error
  }
});

// ============================================
// GET ADMIN DASHBOARD STATS
// ============================================
router.get('/stats/dashboard', authMiddleware, isAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching dashboard statistics');

    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();

    let totalTournaments = 0;
    let activeTournaments = 0;
    if (Tournament) {
      totalTournaments = await Tournament.countDocuments();
      activeTournaments = await Tournament.countDocuments({ status: 'active' });
    }

    let totalTransactions = 0;
    let totalRevenue = 0;
    let successTransactions = 0;
    if (Transaction) {
      const transactions = await Transaction.find({});
      totalTransactions = transactions.length;
      totalRevenue = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      successTransactions = transactions.filter(t => t.status === 'success').length;
    }

    console.log('✅ Dashboard stats calculated');

    res.json({
      success: true,
      data: {
        users: { total: totalUsers },
        games: { total: totalGames },
        tournaments: { total: totalTournaments, active: activeTournaments },
        payments: {
          total: totalTransactions,
          successful: successTransactions,
          totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ success: false, message: 'Error fetching statistics' });
  }
});

module.exports = router;
