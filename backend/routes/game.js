// ============================================
// GAMES ROUTES (routes/game.js)
// ✅ FIXED - No isActive filter
// ============================================

const express = require('express');
const Game = require('../models/game');
const authMiddleware = require('../middleware/authMiddleware');
const router = express.Router();

// ============================================
// GET ALL GAMES (No auth required)
// ✅ FIXED - Removed isActive filter
// ============================================

router.get('/', async (req, res, next) => {
  try {
    console.log('📥 GET /api/games');
    
    const { search, category, skip = 0, limit = 20 } = req.query;

    // Build filter (WITHOUT isActive check)
    let filter = {};
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (category) {
      filter.category = category;
    }

    // Fetch games with pagination
    const games = await Game.find(filter)
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const total = await Game.countDocuments(filter);

    console.log(`✅ Found ${games.length} games`);

    res.json({
      success: true,
      data: games,
      pagination: {
        total,
        skip: parseInt(skip),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching games:', error.message);
    next(error);
  }
});

// ============================================
// GET SINGLE GAME (No auth required)
// ============================================

router.get('/:id', async (req, res, next) => {
  try {
    console.log('📥 GET /api/games/:id -', req.params.id);
    
    const game = await Game.findById(req.params.id);

    if (!game) {
      console.log('❌ Game not found');
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    console.log('✅ Game found:', game.name);

    res.json({
      success: true,
      data: game
    });

  } catch (error) {
    console.error('❌ Error fetching game:', error.message);
    next(error);
  }
});

// ============================================
// CREATE GAME (Admin only)
// ============================================

router.post('/', authMiddleware, async (req, res, next) => {
  try {
    console.log('📥 POST /api/games - User:', req.user.id);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      console.log('❌ User not admin');
      return res.status(403).json({
        success: false,
        message: 'Only admins can create games'
      });
    }

    const { name, genre, category, description, imageUrl } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Game name is required'
      });
    }

    // Check for duplicate
    const existingGame = await Game.findOne({ name });
    if (existingGame) {
      return res.status(409).json({
        success: false,
        message: 'Game already exists'
      });
    }

    const game = new Game({
      name: name.trim(),
      genre: genre || 'Unknown',
      category: category || 'Other',
      description: description || '',
      imageUrl: imageUrl || 'https://via.placeholder.com/400x200?text=Game',
      isActive: true  // ✅ Set to true when creating
    });

    await game.save();
    
    console.log('✅ Game created:', game._id);

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      data: game
    });

  } catch (error) {
    console.error('❌ Error creating game:', error.message);
    next(error);
  }
});

// ============================================
// UPDATE GAME (Admin only)
// ============================================

router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    console.log('📥 PUT /api/games/:id -', req.params.id);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update games'
      });
    }

    const { name, genre, category, description, imageUrl, isActive } = req.body;

    const game = await Game.findById(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Update fields
    if (name) game.name = name.trim();
    if (genre) game.genre = genre;
    if (category) game.category = category;
    if (description) game.description = description;
    if (imageUrl) game.imageUrl = imageUrl;
    if (isActive !== undefined) game.isActive = isActive;

    game.updatedAt = new Date();
    await game.save();

    console.log('✅ Game updated:', game._id);

    res.json({
      success: true,
      message: 'Game updated successfully',
      data: game
    });

  } catch (error) {
    console.error('❌ Error updating game:', error.message);
    next(error);
  }
});

// ============================================
// DELETE GAME (Admin only)
// ============================================

router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    console.log('📥 DELETE /api/games/:id -', req.params.id);

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete games'
      });
    }

    const game = await Game.findByIdAndDelete(req.params.id);

    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    console.log('✅ Game deleted:', req.params.id);

    res.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting game:', error.message);
    next(error);
  }
});

module.exports = router;
