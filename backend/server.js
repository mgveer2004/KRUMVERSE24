const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// 🚨 CRITICAL FIX: Import Helmet for security
const helmet = require('helmet'); 
// 🚨 CRITICAL FIX: Import the centralized error handler
const errorHandler = require('./middleware/errorhandler'); 
require('dotenv').config(); 

const app = express();

// ============================================
// ✅ SECURITY MIDDLEWARE (CRITICAL FIX)
// ============================================
app.use(helmet()); 
app.use(cors()); // Allow cross-origin requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// DATABASE CONNECTION
// ============================================
const dbURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/KRUMVERSE24';

console.log('🔌 Connecting to DB...');

mongoose.connect(dbURI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch(err => console.error('❌ MongoDB Connection Error:', err));

// ============================================
// ROUTE REGISTRATIONS
// ============================================
app.use('/api/auth', require('./routes/auth.js'));
app.use('/api/games', require('./routes/game.js'));
app.use('/api/tournaments', require('./routes/tournament.js'));
app.use('/api/admin', require('./routes/admin.js'));

// ============================================
// STATIC FILES
// ============================================
app.use(express.static('public'));

// ============================================
// 🚨 ERROR HANDLING (CRITICAL FIX)
// Must be placed AFTER all routes
// ============================================
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`
    📡 API Endpoints Available:
       - /api/auth       → Authentication routes
       - /api/games      → Games routes
       - /api/tournaments → Tournament routes
       - /api/admin      → Admin routes
    `);
});