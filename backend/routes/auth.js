// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

// Import the Controller functions (Make sure these exist in authController.js)
const { registerUser, loginUser, getMe } = require('../controllers/authController');

// Import the Middleware you just created
const { protect } = require('../middleware/globalAuth');

// --- ROUTES ---

// 1. Register a new user (Public)
// URL: http://localhost:5000/api/auth/register
router.post('/register', registerUser);

// 2. Login a user (Public)
// URL: http://localhost:5000/api/auth/login
router.post('/login', loginUser);

// 3. Get current user profile (Private/Protected)
// URL: http://localhost:5000/api/auth/me
// We add 'protect' here to block anyone who isn't logged in
router.get('/me', protect, getMe);

module.exports = router;