const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ✅ CRITICAL FIX: Ensure dotenv loads first for all subsequent imports
require('dotenv').config(); 

const app = express();
// ... (rest of the server code remains the same)
// ✅ MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ DATABASE CONNECTION
// We prioritize MONGODB_URI because that is what seed.js used!
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/KRUMVERSE24';

console.log('🔌 Connecting to DB...');

mongoose.connect(dbURI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// ✅ ROUTE REGISTRATIONS (IMPORTANT!)
// ============================================

// Auth Routes
app.use('/api/auth', require('./routes/auth.js'));

// Games Routes
app.use('/api/games', require('./routes/game.js'));

// ✅ TOURNAMENT ROUTES - FIXED: Changed to PLURAL '/api/tournaments'
app.use('/api/tournaments', require('./routes/tournament.js'));

// Admin Routes
app.use('/api/admin', require('./routes/admin.js'));

// ============================================
// ✅ STATIC FILES
// ============================================
app.use(express.static('public'));

// ============================================
// ✅ ERROR HANDLING
// ============================================
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(500).json({
        success: false,
        message: err.message
    });
});

// ============================================
// ✅ START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`
    📡 API Endpoints Available:
       - /api/auth       → Authentication routes
       - /api/games      → Games routes
       - /api/tournaments → Tournament routes (✅ FIXED)
       - /api/admin      → Admin routes
    `);
});
